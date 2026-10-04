import { migrateTaskToV4 } from "@/lib/storage/workspace-migration";
import type { WorkspaceAction } from "@/services/workspace-service";
import type { MigrationCollection } from "@/types/migration";
import type { DomainTask, Task } from "@/types/task";
import type { WorkspaceDomainState } from "@/types/workspace";

type Mutation = { collection: MigrationCollection; operation: "create" | "update" | "delete";
  id: string; item?: Record<string, unknown> };

const actionCollections: Record<string, { collection: MigrationCollection; item: string; id: string }> = {
  task: { collection: "tasks", item: "task", id: "taskId" },
  "study-plan": { collection: "studyPlans", item: "plan", id: "planId" },
  "study-session": { collection: "studySessions", item: "session", id: "sessionId" },
  reading: { collection: "readingItems", item: "item", id: "itemId" },
  project: { collection: "projects", item: "project", id: "projectId" },
  "project-module": { collection: "projectModules", item: "module", id: "moduleId" },
  milestone: { collection: "projectMilestones", item: "milestone", id: "milestoneId" },
  "work-log": { collection: "engineeringLogs", item: "workLog", id: "workLogId" },
  test: { collection: "experiments", item: "testRecord", id: "testRecordId" },
  issue: { collection: "technicalIssues", item: "issue", id: "issueId" },
  solution: { collection: "issueSolutions", item: "solution", id: "solutionId" },
  knowledge: { collection: "knowledge", item: "item", id: "itemId" },
  skill: { collection: "skills", item: "skill", id: "skillId" },
  "skill-evidence": { collection: "skillEvidence", item: "evidence", id: "evidenceId" },
  report: { collection: "reports", item: "report", id: "reportId" },
  resume: { collection: "resumeMaterials", item: "material", id: "materialId" },
  calendar: { collection: "calendarEvents", item: "event", id: "eventId" },
  finance: { collection: "financeTransactions", item: "transaction", id: "transactionId" },
};

function currentItem(domain: WorkspaceDomainState, collection: MigrationCollection, id: string): Record<string, unknown> | undefined {
  const source: unknown = collection in domain.legacy ?
    domain.legacy[collection as keyof WorkspaceDomainState["legacy"]] :
    collection in domain.academic ? domain.academic[collection as keyof WorkspaceDomainState["academic"]] :
      (domain as unknown as Record<string, unknown>)[collection];
  return Array.isArray(source) ? source.find((item: { id?: string }) => item.id === id) : undefined;
}

export function workspaceActionMutation(action: WorkspaceAction, domain: WorkspaceDomainState): Mutation {
  if (action.type === "workspace/replaced") throw new Error("服务器模式不能通过整份 Workspace 快照写入。");
  const [prefix, suffix] = action.type.split("/");
  const spec = actionCollections[prefix];
  if (!spec) throw new Error(`未接入服务器的操作：${action.type}`);
  const operation = suffix === "added" ? "create" : suffix === "updated" ? "update" :
    suffix === "deleted" ? "delete" : null;
  if (!operation) throw new Error(`未接入服务器的操作：${action.type}`);
  const value = action as unknown as Record<string, unknown>;
  const id = operation === "delete" ? value[spec.id] : (value[spec.item] as { id?: unknown } | undefined)?.id;
  if (typeof id !== "string" || !id) throw new Error("记录 ID 无效。");
  if (operation === "delete") return { collection: spec.collection, operation, id };
  const incoming = value[spec.item];
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) throw new Error("记录内容无效。");
  const previous = currentItem(domain, spec.collection, id);
  let item: Record<string, unknown> = { ...(incoming as Record<string, unknown>) };
  if (spec.collection === "projects") {
    item = { tags: [], visibility: "PRIVATE", ...previous, ...item };
  } else if (spec.collection === "tasks") {
    item = migrateTaskToV4(incoming as Task, previous as DomainTask | undefined) as unknown as Record<string, unknown>;
  } else if (spec.collection === "engineeringLogs") {
    item = { environment: "", problem: item.problems ?? "", symptom: "", analysis: "", solution: "", ...previous, ...item };
  } else if (spec.collection === "experiments") {
    item = { hypothesis: "", observations: "", ...previous, ...item };
  } else if (spec.collection === "knowledge" || spec.collection === "skillEvidence") {
    item = { ...previous, ...item };
  }
  return { collection: spec.collection, operation, id, item };
}
