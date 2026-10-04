"use client";

import Link from "next/link";
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ActionToast, type ToastNotice } from "@/components/layout/action-toast";
import { Button } from "@/components/ui/button";
import { createEmptyWorkspaceData } from "@/data/initial-workspace-data";
import { combineDateAndTime, toLocalDateKey } from "@/lib/date";
import { migrateWorkspaceV3, projectDomainToWorkspaceV3 } from "@/lib/storage/workspace-migration";
import { browserEntityRepository, ServerDataError } from "@/repositories/server/browser-entity-repository";
import { workspaceActionMutation } from "@/services/server/workspace-action-mapping";
import { createWorkspaceId, type WorkspaceAction } from "@/services/workspace-service";
import type { StudyPlan, StudyPlanDraft, StudySessionDraft } from "@/types/learning";
import type { MigrationCollection } from "@/types/migration";
import type { ReadingItem, ReadingItemDraft } from "@/types/reading";
import type { EntityMutationResult, ServerWorkspaceSnapshot } from "@/types/server-workspace";
import type { Task, TaskDraft } from "@/types/task";
import type { WorkspaceData, WorkspaceDomainState } from "@/types/workspace";

const emptyDomain = migrateWorkspaceV3(createEmptyWorkspaceData());
const emptySnapshot: ServerWorkspaceSnapshot = { domain: emptyDomain, contentStates: {}, versions: {},
  migrationBatchCount: 0, hasServerRecords: false };

export interface ServerWorkspaceContextValue {
  data: WorkspaceData;
  domain: WorkspaceDomainState;
  snapshot: ServerWorkspaceSnapshot;
  isHydrated: boolean;
  domainRevision: number;
  error: string | null;
  reload(): Promise<void>;
  mutateEntity(collection: MigrationCollection, operation: "create" | "update" | "delete",
    id: string, item?: Record<string, unknown>): Promise<EntityMutationResult>;
  dispatch(action: WorkspaceAction): Promise<void>;
  addTask(draft: TaskDraft): Promise<Task>;
  updateTask(task: Task): Promise<void>;
  deleteTask(taskId: string): Promise<void>;
  duplicateTask(task: Task): Promise<Task>;
  toggleTaskCompleted(taskId: string): Promise<void>;
  addTaskFromContent(content: { id: string; title: string; durationMinutes: number }): Promise<boolean>;
  addStudyPlan(draft: StudyPlanDraft): Promise<StudyPlan>;
  updateStudyPlan(plan: StudyPlan): Promise<void>;
  deleteStudyPlan(planId: string): Promise<void>;
  addStudySession(draft: StudySessionDraft): Promise<void>;
  addReadingItem(draft: ReadingItemDraft): Promise<ReadingItem>;
  updateReadingItem(item: ReadingItem): Promise<void>;
  deleteReadingItem(itemId: string): Promise<void>;
  replaceWorkspaceData(nextData: WorkspaceData): void;
  importWorkspaceBackup(): Promise<void>;
  restoreDemoData(): void;
}

export const ServerWorkspaceContext = createContext<ServerWorkspaceContextValue | null>(null);

function normalizeStudyPlan(plan: StudyPlan): StudyPlan {
  const progress = Math.min(100, Math.round((plan.completedHours / Math.max(plan.targetHours, 0.1)) * 100));
  return { ...plan, progress };
}

function errorMessage(cause: unknown): string {
  const detail = cause instanceof Error ? cause.message : "服务器数据操作失败。";
  return cause instanceof ServerDataError && cause.status === 409 ? `${detail} 请重新加载后再试。` : detail;
}

export function ServerWorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<ServerWorkspaceSnapshot>(emptySnapshot);
  const snapshotRef = useRef(snapshot);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const [isHydrated, setIsHydrated] = useState(false);
  const [domainRevision, setDomainRevision] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<ToastNotice | null>(null);

  const reload = useCallback(async () => {
    try {
      const next = await browserEntityRepository.load();
      snapshotRef.current = next;
      setSnapshot(next);
      setDomainRevision((value) => value + 1);
      setError(null);
      setIsHydrated(true);
    } catch (cause: unknown) {
      setError(errorMessage(cause));
      setIsHydrated(false);
      throw cause;
    }
  }, []);

  useEffect(() => { void reload().catch(() => undefined); }, [reload]);

  const enqueue = useCallback(<T,>(operation: () => Promise<T>): Promise<T> => {
    const running = queueRef.current.then(operation);
    queueRef.current = running.then(() => undefined, () => undefined);
    return running;
  }, []);

  const mutateEntity = useCallback((collection: MigrationCollection,
    operation: "create" | "update" | "delete", id: string, item?: Record<string, unknown>) => enqueue(async () => {
    try {
      const current = snapshotRef.current;
      const version = current.versions[`${collection}:${id}`];
      const result = operation === "create" ?
        await browserEntityRepository.create(collection, item ?? {}) :
        operation === "update" ?
          await browserEntityRepository.update(collection, id, version ?? 0, item ?? {}) :
          await browserEntityRepository.delete(collection, id, version ?? 0);
      try {
        await reload();
      } catch (cause: unknown) {
        setNotice({ id: Date.now(), title: "已保存，页面刷新失败", description: `${errorMessage(cause)} 请点击重试重新读取。` });
      }
      return result;
    } catch (cause: unknown) {
      const message = errorMessage(cause);
      setError(message);
      setNotice({ id: Date.now(), title: "服务器保存失败", description: message });
      throw cause;
    }
  }), [enqueue, reload]);

  const dispatch = useCallback(async (action: WorkspaceAction) => {
    const mutation = workspaceActionMutation(action, snapshotRef.current.domain);
    await mutateEntity(mutation.collection, mutation.operation, mutation.id, mutation.item);
  }, [mutateEntity]);

  const addTask = useCallback(async (draft: TaskDraft): Promise<Task> => {
    const now = new Date().toISOString();
    const task: Task = { ...draft, id: createWorkspaceId("task"), createdAt: now, updatedAt: now };
    await dispatch({ type: "task/added", task });
    return task;
  }, [dispatch]);
  const updateTask = useCallback(async (task: Task) => {
    await dispatch({ type: "task/updated", task: { ...task, updatedAt: new Date().toISOString() } });
  }, [dispatch]);
  const deleteTask = useCallback(async (taskId: string) => {
    await dispatch({ type: "task/deleted", taskId });
  }, [dispatch]);
  const duplicateTask = useCallback(async (task: Task): Promise<Task> => {
    const now = new Date().toISOString();
    const copy: Task = { ...task, id: createWorkspaceId("task"), title: `${task.title}（副本）`, status: "待开始",
      actualHours: 0, sourceType: "manual", sourceId: undefined, completedAt: undefined,
      createdAt: now, updatedAt: now };
    await dispatch({ type: "task/added", task: copy });
    return copy;
  }, [dispatch]);
  const toggleTaskCompleted = useCallback(async (taskId: string) => {
    const current = snapshotRef.current.domain.tasks.find((item) => item.id === taskId);
    if (!current) throw new Error("任务不存在，请重新加载。");
    const task = projectDomainToWorkspaceV3(snapshotRef.current.domain).tasks.find((item) => item.id === taskId);
    if (!task) throw new Error("任务不存在，请重新加载。");
    const completed = task.status === "已完成";
    await updateTask({ ...task, status: completed ? "待开始" : "已完成",
      completedAt: completed ? undefined : new Date().toISOString() });
  }, [updateTask]);
  const addTaskFromContent = useCallback(async (content: { id: string; title: string; durationMinutes: number }) => {
    if (snapshotRef.current.domain.tasks.some((task) => task.creationSourceType === "content" &&
      task.creationSourceId === content.id)) return false;
    const date = toLocalDateKey();
    await addTask({ title: `观看：${content.title}`, description: "从视频与技术内容中心加入的学习任务。",
      status: "待开始", priority: "中", domain: "内容学习", scheduledDate: date,
      dueAt: combineDateAndTime(date, "21:00"),
      estimateHours: Math.max(0.1, Math.round(content.durationMinutes / 6) / 10), actualHours: 0,
      tags: ["技术内容"], sourceType: "content", sourceId: content.id });
    return true;
  }, [addTask]);
  const addStudyPlan = useCallback(async (draft: StudyPlanDraft) => {
    const now = new Date().toISOString();
    const plan = normalizeStudyPlan({ ...draft, id: createWorkspaceId("plan"), progress: 0,
      createdAt: now, updatedAt: now });
    await dispatch({ type: "study-plan/added", plan });
    return plan;
  }, [dispatch]);
  const updateStudyPlan = useCallback(async (plan: StudyPlan) => {
    await dispatch({ type: "study-plan/updated", plan: normalizeStudyPlan({ ...plan,
      updatedAt: new Date().toISOString() }) });
  }, [dispatch]);
  const deleteStudyPlan = useCallback(async (planId: string) => {
    await dispatch({ type: "study-plan/deleted", planId });
  }, [dispatch]);
  const addStudySession = useCallback(async (draft: StudySessionDraft) => {
    await dispatch({ type: "study-session/added", session: { ...draft, id: createWorkspaceId("session"),
      createdAt: new Date().toISOString() } });
  }, [dispatch]);
  const addReadingItem = useCallback(async (draft: ReadingItemDraft) => {
    const now = new Date().toISOString();
    const item: ReadingItem = { ...draft, id: createWorkspaceId("book"), createdAt: now, updatedAt: now };
    await dispatch({ type: "reading/added", item });
    return item;
  }, [dispatch]);
  const updateReadingItem = useCallback(async (item: ReadingItem) => {
    await dispatch({ type: "reading/updated", item: { ...item,
      currentPage: Math.min(Math.max(0, item.currentPage), Math.max(1, item.totalPages)),
      updatedAt: new Date().toISOString() } });
  }, [dispatch]);
  const deleteReadingItem = useCallback(async (itemId: string) => {
    await dispatch({ type: "reading/deleted", itemId });
  }, [dispatch]);

  const data = useMemo(() => projectDomainToWorkspaceV3(snapshot.domain), [snapshot.domain]);
  const value = useMemo<ServerWorkspaceContextValue>(() => ({
    data, domain: snapshot.domain, snapshot, isHydrated, domainRevision, error, reload, mutateEntity, dispatch,
    addTask, updateTask, deleteTask, duplicateTask, toggleTaskCompleted, addTaskFromContent,
    addStudyPlan, updateStudyPlan, deleteStudyPlan, addStudySession, addReadingItem, updateReadingItem,
    deleteReadingItem,
    replaceWorkspaceData: () => { throw new Error("服务器模式禁止整份 Workspace 覆盖；请使用迁移入口。"); },
    importWorkspaceBackup: async () => { throw new Error("服务器模式请通过迁移入口处理旧备份。"); },
    restoreDemoData: () => { setNotice({ id: Date.now(), title: "服务器模式不可恢复演示数据",
      description: "旧浏览器数据仍保留；请使用独立迁移入口。" }); },
  }), [data, snapshot, isHydrated, domainRevision, error, reload, mutateEntity, dispatch,
    addTask, updateTask, deleteTask, duplicateTask, toggleTaskCompleted, addTaskFromContent,
    addStudyPlan, updateStudyPlan, deleteStudyPlan, addStudySession, addReadingItem, updateReadingItem, deleteReadingItem]);

  if (!isHydrated) return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
    <section className="w-full max-w-md rounded-lg border bg-white p-6 text-sm">
      <h1 className="font-semibold">{error ? "服务器数据读取失败" : "正在读取服务器数据…"}</h1>
      {error && <><p role="alert" className="mt-3 text-rose-700">{error}</p>
        <div className="mt-4 flex gap-3"><Button onClick={() => { void reload().catch(() => undefined); }}>重试</Button>
          <Link href="/login" className="self-center text-blue-700">重新登录</Link></div></>}
    </section>
  </main>;

  return <ServerWorkspaceContext.Provider value={value}>
    {!snapshot.hasServerRecords && <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900">
      服务器暂无业务记录。旧浏览器数据仍保留；请先到 <Link href="/migration" className="font-semibold underline">迁移页</Link> 预检查并核对，不会自动上传。
    </div>}
    {children}
    <ActionToast notice={notice} onDismiss={() => setNotice(null)} />
  </ServerWorkspaceContext.Provider>;
}
