import type { StudyPlan, StudySession } from "@/types/learning";
import type { ReadingItem } from "@/types/reading";
import type { Task } from "@/types/task";
import type { WorkspaceData } from "@/types/workspace";

export type WorkspaceAction =
  | { type: "workspace/replaced"; data: WorkspaceData }
  | { type: "task/added"; task: Task }
  | { type: "task/updated"; task: Task }
  | { type: "task/deleted"; taskId: string }
  | { type: "study-plan/added"; plan: StudyPlan }
  | { type: "study-plan/updated"; plan: StudyPlan }
  | { type: "study-plan/deleted"; planId: string }
  | { type: "study-session/added"; session: StudySession }
  | { type: "reading/added"; item: ReadingItem }
  | { type: "reading/updated"; item: ReadingItem }
  | { type: "reading/deleted"; itemId: string };

function withUpdatedMetadata(data: WorkspaceData, updatedAt: string): WorkspaceData {
  return { ...data, metadata: { ...data.metadata, updatedAt } };
}

export function workspaceReducer(data: WorkspaceData, action: WorkspaceAction): WorkspaceData {
  const now = new Date().toISOString();
  switch (action.type) {
    case "workspace/replaced":
      return action.data;
    case "task/added":
      return withUpdatedMetadata({ ...data, tasks: [action.task, ...data.tasks] }, now);
    case "task/updated":
      return withUpdatedMetadata(
        { ...data, tasks: data.tasks.map((task) => (task.id === action.task.id ? action.task : task)) },
        now,
      );
    case "task/deleted":
      return withUpdatedMetadata(
        { ...data, tasks: data.tasks.filter((task) => task.id !== action.taskId) },
        now,
      );
    case "study-plan/added":
      return withUpdatedMetadata({ ...data, studyPlans: [action.plan, ...data.studyPlans] }, now);
    case "study-plan/updated":
      return withUpdatedMetadata(
        { ...data, studyPlans: data.studyPlans.map((plan) => (plan.id === action.plan.id ? action.plan : plan)) },
        now,
      );
    case "study-plan/deleted":
      return withUpdatedMetadata(
        {
          ...data,
          studyPlans: data.studyPlans.filter((plan) => plan.id !== action.planId),
          studySessions: data.studySessions.filter((session) => session.studyPlanId !== action.planId),
        },
        now,
      );
    case "study-session/added": {
      const addedHours = action.session.durationMinutes / 60;
      return withUpdatedMetadata(
        {
          ...data,
          studySessions: [action.session, ...data.studySessions],
          studyPlans: data.studyPlans.map((plan) => {
            if (plan.id !== action.session.studyPlanId) return plan;
            const completedHours = Math.round((plan.completedHours + addedHours) * 100) / 100;
            const progress = Math.min(100, Math.round((completedHours / Math.max(plan.targetHours, 0.1)) * 100));
            return {
              ...plan,
              completedHours,
              progress,
              status: progress >= 100 ? "已完成" : "进行中",
              updatedAt: now,
            };
          }),
        },
        now,
      );
    }
    case "reading/added":
      return withUpdatedMetadata({ ...data, readingItems: [action.item, ...data.readingItems] }, now);
    case "reading/updated":
      return withUpdatedMetadata(
        { ...data, readingItems: data.readingItems.map((item) => (item.id === action.item.id ? action.item : item)) },
        now,
      );
    case "reading/deleted":
      return withUpdatedMetadata(
        { ...data, readingItems: data.readingItems.filter((item) => item.id !== action.itemId) },
        now,
      );
  }
}

export function createWorkspaceId(prefix: string): string {
  const suffix = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${suffix}`;
}

