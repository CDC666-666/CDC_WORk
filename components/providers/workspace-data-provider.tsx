"use client";

import { createContext, useCallback, useEffect, useMemo, useReducer, useState } from "react";

import { ActionToast, type ToastNotice } from "@/components/layout/action-toast";
import { combineDateAndTime, toLocalDateKey } from "@/lib/date";
import { normalizeWorkspaceData } from "@/lib/storage/workspace-normalization";
import {
  createWorkspaceInitialState,
  workspaceDataService,
  type WorkspaceImportPreview,
} from "@/services/workspace-data-service";
import { createWorkspaceId, workspaceReducer, type WorkspaceAction } from "@/services/workspace-service";
import type { StudyPlan, StudyPlanDraft, StudySessionDraft } from "@/types/learning";
import type { ReadingItem, ReadingItemDraft } from "@/types/reading";
import type { Task, TaskDraft } from "@/types/task";
import type { WorkspaceData } from "@/types/workspace";

export interface WorkspaceDataContextValue {
  data: WorkspaceData;
  isHydrated: boolean;
  dispatch: React.Dispatch<WorkspaceAction>;
  addTask: (draft: TaskDraft) => Task;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  duplicateTask: (task: Task) => Task;
  toggleTaskCompleted: (taskId: string) => void;
  addTaskFromContent: (content: { id: string; title: string; durationMinutes: number }) => boolean;
  addStudyPlan: (draft: StudyPlanDraft) => StudyPlan;
  updateStudyPlan: (plan: StudyPlan) => void;
  deleteStudyPlan: (planId: string) => void;
  addStudySession: (draft: StudySessionDraft) => void;
  addReadingItem: (draft: ReadingItemDraft) => ReadingItem;
  updateReadingItem: (item: ReadingItem) => void;
  deleteReadingItem: (itemId: string) => void;
  replaceWorkspaceData: (nextData: WorkspaceData) => void;
  importWorkspaceBackup: (backup: WorkspaceImportPreview) => Promise<void>;
  restoreDemoData: () => void;
}

export const WorkspaceDataContext = createContext<WorkspaceDataContextValue | null>(null);

function normalizeStudyPlan(plan: StudyPlan): StudyPlan {
  const progress = Math.min(100, Math.round((plan.completedHours / Math.max(plan.targetHours, 0.1)) * 100));
  return { ...plan, progress };
}

export function WorkspaceDataProvider({ children }: { children: React.ReactNode }) {
  const [data, dispatch] = useReducer(workspaceReducer, undefined, createWorkspaceInitialState);
  const [isHydrated, setIsHydrated] = useState(false);
  const [notice, setNotice] = useState<ToastNotice | null>(null);

  useEffect(() => {
    let active = true;
    void workspaceDataService.load().then((result) => {
      if (!active) return;
      dispatch({ type: "workspace/replaced", data: result.data });
      if (result.message) {
        setNotice({ id: Date.now(), title: "本地数据已恢复", description: result.message });
      }
      setIsHydrated(true);
    }).catch(() => {
      if (!active) return;
      setNotice({ id: Date.now(), title: "本地数据读取失败", description: "请检查浏览器存储后重试。" });
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    void workspaceDataService.save(data).then((saved) => {
      if (!saved) {
        setNotice({ id: Date.now(), title: "本地数据保存失败", description: "请导出备份并检查浏览器存储空间。" });
      }
    }).catch(() => {
      setNotice({ id: Date.now(), title: "本地数据保存失败", description: "请导出备份并检查浏览器存储空间。" });
    });
  }, [data, isHydrated]);

  const addTask = useCallback((draft: TaskDraft) => {
    const now = new Date().toISOString();
    const task: Task = { ...draft, id: createWorkspaceId("task"), createdAt: now, updatedAt: now };
    dispatch({ type: "task/added", task });
    return task;
  }, []);

  const updateTask = useCallback((task: Task) => {
    dispatch({ type: "task/updated", task: { ...task, updatedAt: new Date().toISOString() } });
  }, []);

  const deleteTask = useCallback((taskId: string) => dispatch({ type: "task/deleted", taskId }), []);

  const duplicateTask = useCallback((task: Task) => {
    const now = new Date().toISOString();
    const copy: Task = {
      ...task,
      id: createWorkspaceId("task"),
      title: `${task.title}（副本）`,
      status: "待开始",
      actualHours: 0,
      sourceType: "manual",
      sourceId: undefined,
      completedAt: undefined,
      createdAt: now,
      updatedAt: now,
    };
    dispatch({ type: "task/added", task: copy });
    return copy;
  }, []);

  const toggleTaskCompleted = useCallback((taskId: string) => {
    const task = data.tasks.find((candidate) => candidate.id === taskId);
    if (!task) return;
    const now = new Date().toISOString();
    const isCompleted = task.status === "已完成";
    dispatch({
      type: "task/updated",
      task: {
        ...task,
        status: isCompleted ? "待开始" : "已完成",
        completedAt: isCompleted ? undefined : now,
        updatedAt: now,
      },
    });
  }, [data.tasks]);

  const addTaskFromContent = useCallback((content: { id: string; title: string; durationMinutes: number }) => {
    if (data.tasks.some((task) => task.sourceType === "content" && task.sourceId === content.id)) return false;
    const date = toLocalDateKey();
    addTask({
      title: `观看：${content.title}`,
      description: "从视频与技术内容中心加入的学习任务。",
      status: "待开始",
      priority: "中",
      domain: "内容学习",
      scheduledDate: date,
      dueAt: combineDateAndTime(date, "21:00"),
      estimateHours: Math.max(0.1, Math.round((content.durationMinutes / 60) * 10) / 10),
      actualHours: 0,
      tags: ["技术内容"],
      sourceType: "content",
      sourceId: content.id,
    });
    return true;
  }, [addTask, data.tasks]);

  const addStudyPlan = useCallback((draft: StudyPlanDraft) => {
    const now = new Date().toISOString();
    const plan = normalizeStudyPlan({ ...draft, id: createWorkspaceId("plan"), progress: 0, createdAt: now, updatedAt: now });
    dispatch({ type: "study-plan/added", plan });
    return plan;
  }, []);

  const updateStudyPlan = useCallback((plan: StudyPlan) => {
    dispatch({ type: "study-plan/updated", plan: normalizeStudyPlan({ ...plan, updatedAt: new Date().toISOString() }) });
  }, []);

  const deleteStudyPlan = useCallback((planId: string) => dispatch({ type: "study-plan/deleted", planId }), []);

  const addStudySession = useCallback((draft: StudySessionDraft) => {
    dispatch({
      type: "study-session/added",
      session: { ...draft, id: createWorkspaceId("session"), createdAt: new Date().toISOString() },
    });
  }, []);

  const addReadingItem = useCallback((draft: ReadingItemDraft) => {
    const now = new Date().toISOString();
    const item: ReadingItem = { ...draft, id: createWorkspaceId("book"), createdAt: now, updatedAt: now };
    dispatch({ type: "reading/added", item });
    return item;
  }, []);

  const updateReadingItem = useCallback((item: ReadingItem) => {
    const currentPage = Math.min(Math.max(0, item.currentPage), Math.max(1, item.totalPages));
    dispatch({
      type: "reading/updated",
      item: { ...item, currentPage, updatedAt: new Date().toISOString() },
    });
  }, []);

  const deleteReadingItem = useCallback((itemId: string) => dispatch({ type: "reading/deleted", itemId }), []);

  const replaceWorkspaceData = useCallback((nextData: WorkspaceData) => {
    dispatch({ type: "workspace/replaced", data: normalizeWorkspaceData(nextData) });
  }, []);

  const importWorkspaceBackup = useCallback(async (backup: WorkspaceImportPreview) => {
    const imported = await workspaceDataService.importBackup(backup);
    dispatch({ type: "workspace/replaced", data: normalizeWorkspaceData(imported) });
  }, []);

  const restoreDemoData = useCallback(() => {
    void workspaceDataService.reset().then((resetData) => {
      dispatch({ type: "workspace/replaced", data: normalizeWorkspaceData(resetData) });
    }).catch(() => {
      setNotice({ id: Date.now(), title: "恢复演示数据失败", description: "请检查浏览器存储后重试。" });
    });
  }, []);

  const value = useMemo<WorkspaceDataContextValue>(() => ({
    data,
    isHydrated,
    dispatch,
    addTask,
    updateTask,
    deleteTask,
    duplicateTask,
    toggleTaskCompleted,
    addTaskFromContent,
    addStudyPlan,
    updateStudyPlan,
    deleteStudyPlan,
    addStudySession,
    addReadingItem,
    updateReadingItem,
    deleteReadingItem,
    replaceWorkspaceData,
    importWorkspaceBackup,
    restoreDemoData,
  }), [
    data,
    isHydrated,
    addTask,
    updateTask,
    deleteTask,
    duplicateTask,
    toggleTaskCompleted,
    addTaskFromContent,
    addStudyPlan,
    updateStudyPlan,
    deleteStudyPlan,
    addStudySession,
    addReadingItem,
    updateReadingItem,
    deleteReadingItem,
    replaceWorkspaceData,
    importWorkspaceBackup,
    restoreDemoData,
  ]);

  return (
    <WorkspaceDataContext.Provider value={value}>
      {children}
      <ActionToast notice={notice} onDismiss={() => setNotice(null)} />
    </WorkspaceDataContext.Provider>
  );
}

