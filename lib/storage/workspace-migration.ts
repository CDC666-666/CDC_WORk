import { createInitialWorkspaceData } from "@/data/initial-workspace-data";
import { isLegacyCompletedTaskIds } from "@/lib/storage/workspace-validation";
import { normalizeWorkspaceData } from "@/lib/storage/workspace-normalization";
import type { DomainTask } from "@/types/task";
import type { WorkspaceData, WorkspaceDataV2, WorkspaceDomainState } from "@/types/workspace";

export const LEGACY_TASK_STORAGE_KEY = "cdc-dashboard-task-state-v1";

function omitKeys<T extends object, K extends keyof T>(item: T, keys: readonly K[]): Omit<T, K> {
  const copy: Partial<T> = { ...item };
  for (const key of keys) delete copy[key];
  return copy as Omit<T, K>;
}

export function migrateTaskToV4(task: WorkspaceData["tasks"][number], previous?: DomainTask): DomainTask {
  const { dueAt, projectId, sourceType, sourceId, ...fields } = task;
  const relationship = projectId
    ? { sourceType: "PROJECT" as const, relatedId: projectId }
    : previous?.sourceType === "COURSE"
      ? { sourceType: "COURSE" as const, relatedId: previous.relatedId }
      : sourceType === "content" || sourceType === "reading" || task.domain === "学校学习"
        ? { sourceType: "LEARNING" as const, relatedId: sourceId }
        : { sourceType: "PERSONAL" as const, relatedId: undefined };
  return {
    ...fields,
    deadline: dueAt,
    ...relationship,
    creationSourceType: sourceType,
    creationSourceId: sourceId,
  };
}

/** Preserve all first-class v3 collections; normalize stale derived calendar copies. */
export function migrateWorkspaceV3(data: WorkspaceData, now = new Date()): WorkspaceDomainState {
  const normalized = normalizeWorkspaceData(data);
  const { tasks, projects, projectModules, projectMilestones, workLogs, testRecords,
    knowledgeItems, skills, skillEvidence, metadata, ...legacy } = normalized;
  return {
    metadata: { schemaVersion: 4, createdAt: metadata.createdAt, updatedAt: now.toISOString() },
    projects: projects.map((project) => ({ ...project, tags: [], visibility: "PRIVATE" })),
    projectModules: structuredClone(projectModules),
    projectMilestones: structuredClone(projectMilestones),
    tasks: tasks.map((task) => migrateTaskToV4(task)),
    engineeringLogs: workLogs.map((log) => ({ ...log, environment: "", problem: log.problems, symptom: "", analysis: "", solution: "" })),
    experiments: testRecords.map((record) => ({ ...record, hypothesis: "", observations: "" })),
    knowledge: knowledgeItems.map((item) => ({ ...item })),
    skills: structuredClone(skills),
    skillEvidence: skillEvidence.map((item) => ({ ...item })),
    academic: { semesters: [], courses: [], chapters: [], classSessions: [], assignments: [], exams: [] },
    reviews: [], timeline: [], attachments: [],
    legacy: structuredClone(legacy),
  };
}

/** Read adapter for the unchanged React reducer and existing pages. */
export function projectDomainToWorkspaceV3(domain: WorkspaceDomainState): WorkspaceData {
  return {
    ...structuredClone(domain.legacy),
    projects: domain.projects.map((project) => omitKeys(project, ["tags", "visibility", "publicSummary"])),
    projectModules: structuredClone(domain.projectModules),
    projectMilestones: structuredClone(domain.projectMilestones),
    tasks: domain.tasks.map(({ deadline, relatedId, creationSourceType, creationSourceId, sourceType, ...task }) => ({
      ...task,
      dueAt: deadline,
      ...(sourceType === "PROJECT" && relatedId !== undefined ? { projectId: relatedId } : {}),
      sourceType: creationSourceType ?? "manual",
      ...(creationSourceId !== undefined ? { sourceId: creationSourceId } : {}),
    })),
    workLogs: domain.engineeringLogs.map((log) => omitKeys(log, ["environment", "problem", "symptom", "analysis", "solution"])),
    testRecords: domain.experiments.map((record) => omitKeys(record, ["hypothesis", "observations"])),
    knowledgeItems: domain.knowledge.map((item) => omitKeys(item, ["courseId"])),
    skills: structuredClone(domain.skills),
    skillEvidence: domain.skillEvidence.map((item) => omitKeys(item, ["courseId", "knowledgeId"])),
    metadata: { schemaVersion: 3, createdAt: domain.metadata.createdAt, updatedAt: domain.metadata.updatedAt },
  };
}

/** Apply edits from v3 pages while preserving v4-only records and fields. */
export function mergeWorkspaceV3IntoDomain(data: WorkspaceData, current: WorkspaceDomainState): WorkspaceDomainState {
  const next = migrateWorkspaceV3(data);
  const projects = new Map(current.projects.map((item) => [item.id, item]));
  const tasks = new Map(current.tasks.map((item) => [item.id, item]));
  const logs = new Map(current.engineeringLogs.map((item) => [item.id, item]));
  const experiments = new Map(current.experiments.map((item) => [item.id, item]));
  const knowledge = new Map(current.knowledge.map((item) => [item.id, item]));
  const evidence = new Map(current.skillEvidence.map((item) => [item.id, item]));
  return {
    ...next,
    metadata: { ...next.metadata, createdAt: current.metadata.createdAt },
    projects: next.projects.map((item) => ({ ...item, tags: projects.get(item.id)?.tags ?? [],
      visibility: projects.get(item.id)?.visibility ?? "PRIVATE", publicSummary: projects.get(item.id)?.publicSummary })),
    tasks: next.tasks.map((item) => {
      const previous = tasks.get(item.id);
      if (item.sourceType === "PROJECT" || !previous) return item;
      if (previous.sourceType === "COURSE") return { ...item, sourceType: "COURSE", relatedId: previous.relatedId };
      if (previous.sourceType === "LEARNING" && item.sourceType === "LEARNING" && !item.relatedId) {
        return { ...item, relatedId: previous.relatedId };
      }
      return item;
    }),
    engineeringLogs: next.engineeringLogs.map((item) => ({ ...item,
      environment: logs.get(item.id)?.environment ?? "", problem: logs.get(item.id)?.problem ?? item.problem,
      symptom: logs.get(item.id)?.symptom ?? "",
      analysis: logs.get(item.id)?.analysis ?? "", solution: logs.get(item.id)?.solution ?? "" })),
    experiments: next.experiments.map((item) => ({ ...item,
      hypothesis: experiments.get(item.id)?.hypothesis ?? "", observations: experiments.get(item.id)?.observations ?? "" })),
    knowledge: next.knowledge.map((item) => ({ ...item, courseId: knowledge.get(item.id)?.courseId })),
    skillEvidence: next.skillEvidence.map((item) => ({ ...item, courseId: evidence.get(item.id)?.courseId,
      knowledgeId: evidence.get(item.id)?.knowledgeId })),
    academic: current.academic,
    reviews: current.reviews,
    timeline: current.timeline,
    attachments: current.attachments,
  };
}

export function migrateWorkspaceV2(data: WorkspaceDataV2, now = new Date()): WorkspaceData {
  const defaults = createInitialWorkspaceData(now);
  return normalizeWorkspaceData({
    ...defaults,
    tasks: data.tasks.map((task) => ({ ...task, tags: [...task.tags] })),
    studyPlans: data.studyPlans.map((plan) => ({ ...plan, tags: [...plan.tags] })),
    studySessions: data.studySessions.map((session) => ({ ...session })),
    readingItems: data.readingItems.map((item) => ({ ...item, tags: [...item.tags] })),
    metadata: {
      schemaVersion: 3,
      createdAt: data.metadata.createdAt,
      updatedAt: now.toISOString(),
    },
  });
}

export function migrateLegacyTaskState(rawValue: string | null, now = new Date()): WorkspaceData {
  const data = createInitialWorkspaceData(now);
  if (!rawValue) return normalizeWorkspaceData(data);

  try {
    const parsed: unknown = JSON.parse(rawValue);
    if (!isLegacyCompletedTaskIds(parsed)) return normalizeWorkspaceData(data);
    const completedIds = new Set(parsed);
    const timestamp = now.toISOString();
    return normalizeWorkspaceData({
      ...data,
      tasks: data.tasks.map((task) =>
        completedIds.has(task.id)
          ? { ...task, status: "已完成", completedAt: timestamp, updatedAt: timestamp }
          : task,
      ),
      metadata: { ...data.metadata, updatedAt: timestamp },
    });
  } catch {
    return normalizeWorkspaceData(data);
  }
}

