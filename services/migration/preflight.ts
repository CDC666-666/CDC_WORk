import { createInitialWorkspaceData } from "@/data/initial-workspace-data";
import { mockContentItems } from "@/data/mock-content";
import { isWorkspaceDomainState } from "@/lib/storage/domain-validation";
import { migrateWorkspaceV2, migrateWorkspaceV3 } from "@/lib/storage/workspace-migration";
import { isWorkspaceData, isWorkspaceDataV2 } from "@/lib/storage/workspace-validation";
import { MIGRATION_COLLECTIONS, type MigrationCollection, type MigrationEntity,
  type MigrationIssue, type MigrationRelation, type RawBrowserSnapshot } from "@/types/migration";
import type { WorkspaceDomainState } from "@/types/workspace";

type Item = Record<string, unknown>;
const asItem = (value: object): Item => value as Item;

/** Stable object-key order makes demo comparison independent of JSON key order. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function parse(raw: string | null): unknown {
  if (!raw) return null;
  try { return JSON.parse(raw) as unknown; } catch { return null; }
}

function collectionArrays(state: WorkspaceDomainState): Record<Exclude<MigrationCollection, "contentStates">, Item[]> {
  const entries = {
    projects: state.projects, projectModules: state.projectModules, projectMilestones: state.projectMilestones,
    tasks: state.tasks, engineeringLogs: state.engineeringLogs, experiments: state.experiments,
    knowledge: state.knowledge, skills: state.skills, skillEvidence: state.skillEvidence,
    timeline: state.timeline, reviews: state.reviews, attachments: state.attachments,
    ...state.academic, ...state.legacy,
  };
  return Object.fromEntries(Object.entries(entries).map(([key, value]) =>
    [key, (value as object[]).map(asItem)])) as Record<Exclude<MigrationCollection, "contentStates">, Item[]>;
}

function reference(field: string, collection: MigrationCollection, value: unknown): MigrationRelation[] {
  return typeof value === "string" && value.length ? [{ field, collection, id: value }] : [];
}

export function migrationRelations(collection: MigrationCollection, item: Item): MigrationRelation[] {
  const refs: MigrationRelation[] = [];
  const add = (field: string, target: MigrationCollection) => refs.push(...reference(field, target, item[field]));
  const project = () => add("projectId", "projects");
  const course = () => add("courseId", "courses");
  if (["projectModules", "projectMilestones", "engineeringLogs", "experiments", "knowledge",
    "technicalIssues", "reports", "resumeMaterials", "skillEvidence"].includes(collection)) project();
  if (collection === "projectModules") add("parentId", "projectModules");
  if (collection === "tasks") {
    if (item.sourceType === "PROJECT") add("relatedId", "projects");
    if (item.sourceType === "COURSE") add("relatedId", "courses");
    if (item.sourceType === "LEARNING" && item.creationSourceType === "reading") add("relatedId", "readingItems");
    add("moduleId", "projectModules");
  }
  if (["engineeringLogs", "experiments", "technicalIssues"].includes(collection)) {
    add("moduleId", "projectModules"); add("taskId", "tasks");
  }
  if (collection === "experiments") add("workLogId", "engineeringLogs");
  if (collection === "knowledge") {
    add("moduleId", "projectModules"); course();
    const source: Record<string, MigrationCollection> = {
      workLog: "engineeringLogs", issue: "technicalIssues", test: "experiments",
      reading: "readingItems", project: "projects",
    };
    if (typeof item.sourceType === "string" && source[item.sourceType]) add("sourceId", source[item.sourceType]);
  }
  if (collection === "skills") add("parentId", "skills");
  if (collection === "skillEvidence") {
    add("skillId", "skills"); course(); add("knowledgeId", "knowledge");
    const source: Record<string, MigrationCollection> = {
      task: "tasks", study: "studySessions", workLog: "engineeringLogs", test: "experiments",
      issue: "technicalIssues", knowledge: "knowledge", project: "projects",
    };
    if (typeof item.evidenceType === "string" && source[item.evidenceType]) add("sourceId", source[item.evidenceType]);
  }
  if (["timeline", "reviews"].includes(collection)) add("relatedProjectId", "projects");
  if (collection === "attachments") {
    const target: Record<string, MigrationCollection> = {
      PROJECT: "projects", ENGINEERING_LOG: "engineeringLogs", KNOWLEDGE: "knowledge",
      REVIEW: "reviews", COURSE: "courses", ASSIGNMENT: "assignments", EXPERIMENT: "experiments",
    };
    if (typeof item.relatedType === "string" && target[item.relatedType]) add("relatedId", target[item.relatedType]);
  }
  if (collection === "courses") add("semesterId", "semesters");
  if (["chapters", "classSessions", "assignments", "exams"].includes(collection)) course();
  if (collection === "studySessions") add("studyPlanId", "studyPlans");
  if (collection === "technicalIssues") add("testRecordId", "experiments");
  if (collection === "issueSolutions") add("issueId", "technicalIssues");
  if (collection === "calendarEvents") {
    const source: Record<string, MigrationCollection> = {
      task: "tasks", studyPlan: "studyPlans", reading: "readingItems",
      milestone: "projectMilestones", assignment: "assignments",
    };
    if (typeof item.sourceType === "string" && source[item.sourceType]) add("sourceId", source[item.sourceType]);
  }
  return refs;
}

function validDate(value: unknown): boolean {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const dateFields: Partial<Record<MigrationCollection, string[]>> = {
  projects: ["startDate", "endDate"], projectMilestones: ["targetDate", "completedDate"],
  tasks: ["scheduledDate"], engineeringLogs: ["date"], timeline: ["date"], reviews: ["date"],
  chapters: ["learnDate"], classSessions: ["date"], exams: ["date"],
  studyPlans: ["deadline"], studySessions: ["date"], readingItems: ["startDate", "targetDate"],
  reports: ["dateFrom", "dateTo"], financeTransactions: ["date"],
};

export function migrationValueIssues(collection: MigrationCollection, item: Item): string[] {
  const problems: string[] = [];
  for (const field of dateFields[collection] ?? []) {
    const value = item[field];
    if (value !== undefined && value !== null && value !== "" && !validDate(value)) problems.push(`${field} 不是有效本地日期`);
  }
  if (collection === "financeTransactions") {
    const amount = item.amount;
    const decimal = typeof amount === "number" ? amount.toString() : "";
    const validDecimal = /^-?\d+(?:\.\d{1,2})?$/.test(decimal);
    const [whole, fraction = ""] = decimal.replace(/^-/, "").split(".");
    const cents = validDecimal ? BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0")) : null;
    if (typeof amount !== "number" || !Number.isFinite(amount) ||
      !validDecimal || cents === null || cents > BigInt(Number.MAX_SAFE_INTEGER)) {
      problems.push("amount 无法无损表示为两位十进制金额");
    }
  }
  if (collection === "tasks" && !["待开始", "进行中", "已完成", "受阻"].includes(String(item.status))) {
    problems.push("任务状态无效");
  }
  if (collection === "assignments" && !["TODO", "IN_PROGRESS", "COMPLETED"].includes(String(item.status))) {
    problems.push("作业状态无效");
  }
  if (collection === "contentStates" &&
    (!["unprocessed", "watchLater", "summarized", "favorite", "completed"].includes(String(item.status)) ||
      ["isFavorite", "isInKnowledgeBase", "isInStudyPlan"].some((key) => typeof item[key] !== "boolean"))) {
    problems.push("内容状态或进度标记无效");
  }
  return problems;
}

export interface PreparedMigration {
  sourceKind: "v4" | "v3" | "v2" | "none";
  entities: MigrationEntity[];
  issues: MigrationIssue[];
  fatal: boolean;
}

/** Pure precheck: no browser writes, Repository load, API call, or fallback demo creation. */
export function prepareRawMigration(raw: RawBrowserSnapshot): PreparedMigration {
  const issues: MigrationIssue[] = [];
  let state: WorkspaceDomainState | null = null;
  let droppedV3CalendarEvents: Item[] = [];
  let sourceKind: PreparedMigration["sourceKind"] = "none";
  let fatal = false;
  const v4 = parse(raw["cdc-workspace-data-v4"]);
  if (raw["cdc-workspace-data-v4"]) {
    if (isWorkspaceDomainState(v4)) { state = v4; sourceKind = "v4"; }
    else {
      issues.push({ collection: "snapshot", sourceId: "v4", code: "INVALID_SOURCE",
        message: "v4 原文无效；已保留，不会默默以旧快照替代。" });
      fatal = true;
    }
  }
  if (!state) {
    const v3 = parse(raw["cdc-workspace-data-v3"]);
    if (isWorkspaceData(v3)) {
      state = migrateWorkspaceV3(v3, new Date(v3.metadata.updatedAt)); sourceKind = "v3";
      droppedV3CalendarEvents = v3.calendarEvents.filter((item) => item.sourceType !== "manual").map(asItem);
    } else if (raw["cdc-workspace-data-v3"]) {
      issues.push({ collection: "snapshot", sourceId: "v3", code: "INVALID_SOURCE", message: "v3 快照无效，原文仍在浏览器。" });
    }
  }
  if (!state) {
    const v2 = parse(raw["cdc-workspace-data-v2"]);
    if (isWorkspaceDataV2(v2)) {
      const now = new Date(v2.metadata.updatedAt);
      state = migrateWorkspaceV3(migrateWorkspaceV2(v2, now), now); sourceKind = "v2";
    } else if (raw["cdc-workspace-data-v2"]) {
      issues.push({ collection: "snapshot", sourceId: "v2", code: "INVALID_SOURCE", message: "v2 快照无效，原文仍在浏览器。" });
    }
  }
  if (sourceKind === "v4" && (raw["cdc-workspace-data-v3"] || raw["cdc-workspace-data-v2"])) {
    issues.push({ collection: "snapshot", sourceId: "legacy", code: "AMBIGUOUS",
      message: "旧快照仅作为恢复来源保留，本次不叠加，避免重复。" });
  }
  if (raw["cdc-workspace-data-v4-invalid-backup"]) {
    issues.push({ collection: "snapshot", sourceId: "recovery", code: "AMBIGUOUS",
      message: "存在 v4 失效原文恢复键；迁移不会删除，需人工核对其中是否有额外个人记录。" });
  }
  if (raw["cdc-dashboard-task-state-v1"]) {
    issues.push({ collection: "snapshot", sourceId: "legacy-task", code: "AMBIGUOUS",
      message: "旧任务完成状态键保留作恢复来源，不叠加到已选 Workspace 快照。" });
  }
  if (!state && (raw["cdc-workspace-data-v4"] || raw["cdc-workspace-data-v3"] || raw["cdc-workspace-data-v2"])) fatal = true;

  const contentRaw = parse(raw["cdc-content-state-v1"]);
  const contentItems: Item[] = [];
  if (raw["cdc-content-state-v1"]) {
    if (contentRaw && typeof contentRaw === "object" && !Array.isArray(contentRaw) &&
      "version" in contentRaw && contentRaw.version === 1 && "items" in contentRaw &&
      contentRaw.items && typeof contentRaw.items === "object" && !Array.isArray(contentRaw.items)) {
      for (const [id, value] of Object.entries(contentRaw.items)) {
        if (value && typeof value === "object" && !Array.isArray(value)) {
          const item = value as Item;
          contentItems.push({ ...item, id, ...(typeof item.id === "string" && item.id !== id ? { embeddedId: item.id } : {}) });
        }
        else contentItems.push({ id, rawValue: value });
      }
    } else {
      issues.push({ collection: "snapshot", sourceId: "content", code: "INVALID_SOURCE", message: "独立内容状态原文无效，仍留在浏览器。" });
      fatal = true;
    }
  }

  const baseline = state ? collectionArrays(migrateWorkspaceV3(
    createInitialWorkspaceData(new Date(state.metadata.createdAt)), new Date(state.metadata.createdAt))) : null;
  const arrays = state ? collectionArrays(state) : null;
  if (arrays && sourceKind === "v2") {
    // v2 migration helper fills absent modules with demo data for the UI. They are not part of the source.
    for (const collection of MIGRATION_COLLECTIONS) {
      if (collection !== "contentStates" && !["tasks", "studyPlans", "studySessions", "readingItems"].includes(collection)) {
        arrays[collection] = [];
      }
    }
  }
  if (arrays && sourceKind === "v3") arrays.calendarEvents.push(...droppedV3CalendarEvents);
  const contentDefaults = new Map(mockContentItems.map((item) => [item.id, {
    id: item.id, status: item.status, isFavorite: item.isFavorite,
    isInKnowledgeBase: item.isInKnowledgeBase, isInStudyPlan: item.isInStudyPlan,
  }]));
  const entities: MigrationEntity[] = [];
  for (const collection of MIGRATION_COLLECTIONS) {
    const items = collection === "contentStates" ? contentItems : arrays?.[collection] ?? [];
    const defaults = collection === "contentStates" ? contentDefaults :
      new Map((baseline?.[collection] ?? []).map((item) => [item.id, item]));
    const frequencies = new Map<string, number>();
    for (const item of items) if (typeof item.id === "string") {
      frequencies.set(item.id, (frequencies.get(item.id) ?? 0) + 1);
    }
    for (const [sourceOrdinal, item] of items.entries()) {
      const id = typeof item.id === "string" && item.id ? item.id : `__missing_id_${sourceOrdinal}`;
      const reasons = migrationValueIssues(collection, item);
      if (collection === "calendarEvents" && droppedV3CalendarEvents.includes(item)) {
        reasons.push("v3 旧日历派生记录在常规升级中会被过滤；已保留原文，需人工核对");
      }
      if (typeof item.id !== "string" || !item.id) reasons.push("记录缺少 ID");
      if ((frequencies.get(id) ?? 0) > 1) reasons.push("同一集合内 ID 重复");
      if ("rawValue" in item && collection === "contentStates") reasons.push("内容状态结构无效");
      if ("embeddedId" in item && collection === "contentStates") reasons.push("内容状态内部 ID 与存储键不一致");
      const sample = defaults.get(id);
      const origin = sample === undefined ? "PERSONAL" :
        canonicalJson(item) === canonicalJson(sample) ? "DEMO" :
          collection === "contentStates" ? "PERSONAL" : "NEEDS_REVIEW";
      if (collection === "contentStates" && !contentDefaults.has(id)) reasons.push("内容 ID 不在内置目录中");
      entities.push({ collection, id, sourceOrdinal, payload: item, relations: migrationRelations(collection, item), origin, reasons });
    }
  }
  const ids = new Map(MIGRATION_COLLECTIONS.map((key) => [key,
    new Set(entities.filter((item) => item.collection === key).map((item) => item.id))]));
  for (const entity of entities) {
    if (entity.collection === "reports" && Array.isArray(entity.payload.sourceRefs)) {
      const reportSources: MigrationCollection[] = ["tasks", "engineeringLogs", "experiments", "technicalIssues", "knowledge"];
      for (const sourceId of entity.payload.sourceRefs) {
        if (typeof sourceId !== "string") {
          entity.reasons.push("sourceRefs 含非字符串来源");
          continue;
        }
        const matches = reportSources.filter((collection) => ids.get(collection)?.has(sourceId));
        if (matches.length === 1) entity.relations.push({ field: "sourceRefs", collection: matches[0], id: sourceId });
        else entity.reasons.push(matches.length ? `sourceRefs:${sourceId} 匹配多个集合` :
          `sourceRefs:${sourceId} 指向缺失的来源`);
      }
    }
    for (const relation of entity.relations) {
      if (!ids.get(relation.collection)?.has(relation.id)) {
        entity.reasons.push(`${relation.field} 指向缺失的 ${relation.collection}:${relation.id}`);
      }
    }
    if (entity.collection === "reviews" && entity.payload.type === "PROJECT" && !entity.payload.relatedProjectId) {
      entity.reasons.push("项目复盘缺少关联项目");
    }
    if (entity.collection === "tasks" && ["PROJECT", "COURSE"].includes(String(entity.payload.sourceType)) &&
      !entity.payload.relatedId) entity.reasons.push("任务来源缺少 relatedId");
    if (entity.collection === "attachments" && !entity.payload.relatedId) entity.reasons.push("附件缺少 relatedId");
    if (entity.reasons.length) issues.push({ collection: entity.collection, sourceId: entity.id,
      code: entity.reasons.some((reason) => reason.includes("指向") || reason.includes("关联")) ? "BROKEN_REFERENCE" : "INVALID_VALUE",
      message: entity.reasons.join("；") });
  }
  return { sourceKind, entities, issues, fatal };
}
