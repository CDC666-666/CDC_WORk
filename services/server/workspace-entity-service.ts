import "server-only";

import type { Prisma } from "@prisma/client";
import { mockContentItems } from "@/data/mock-content";
import { createEmptyWorkspaceData } from "@/data/initial-workspace-data";
import { ApiError } from "@/lib/server/api-response";
import { prisma } from "@/lib/server/prisma";
import { migrateWorkspaceV3 } from "@/lib/storage/workspace-migration";
import { deleteEntity, findEntity, insertEntity, listEntities, updateEntity, type StoredEntity } from "@/repositories/server/entity-repository";
import { migrationRelations, migrationValueIssues } from "@/services/migration/preflight";
import { experienceValidationIssues } from "@/services/engineering-experience-service";
import { MIGRATION_TABLES } from "@/services/migration/registry";
import { canonicalReflectionDate } from "@/services/reflection-period";
import { MIGRATION_COLLECTIONS, type MigrationCollection, type MigrationRelation } from "@/types/migration";
import type { EntityMutationResult, ServerWorkspaceSnapshot } from "@/types/server-workspace";
import type { WorkspaceDomainState } from "@/types/workspace";

type Item = Record<string, unknown>;
const collections = new Set<string>(MIGRATION_COLLECTIONS);
const requiredText: Partial<Record<MigrationCollection, readonly string[]>> = {
  projects: ["name"], projectModules: ["projectId"], projectMilestones: ["projectId"],
  tasks: ["title", "status"], engineeringLogs: ["projectId"], experiments: ["projectId"],
  knowledge: ["title"], skills: ["name"], skillEvidence: ["skillId"],
  reviews: ["type", "date", "summary"], attachments: ["url", "type", "relatedType", "relatedId"],
  semesters: ["name"], courses: ["name", "semesterId"],
  chapters: ["courseId"], classSessions: ["courseId"], assignments: ["courseId", "title"],
  exams: ["courseId"], studyPlans: ["title"], studySessions: ["studyPlanId"], readingItems: ["title"],
  technicalIssues: ["title"], issueSolutions: ["issueId"],
  reports: ["title"], resumeMaterials: ["title"], financeTransactions: ["type", "date"],
};

export function parseEntityCollection(value: string): MigrationCollection {
  if (!collections.has(value)) throw new ApiError(404, "业务集合不存在。");
  return value as MigrationCollection;
}

function payloadOf(collection: MigrationCollection, row: StoredEntity): Item {
  if (row.payload) return row.payload;
  if (collection === "projects") {
    const value = row.columns;
    const date = (field: string) => typeof value[field] === "string" ? (value[field] as string).slice(0, 10) : "";
    return { id: row.id, name: String(value.name ?? ""), code: String(value.code ?? ""),
      category: String(value.category ?? "个人"), role: String(value.role ?? ""),
      description: String(value.description ?? ""), status: String(value.status ?? "规划中"),
      progress: Number(value.progress ?? 0), startDate: date("startDate"), endDate: date("endDate"),
      objectives: value.objectives ?? [], responsibilities: value.responsibilities ?? [],
      techStack: value.techStack ?? [], repositoryUrl: String(value.repositoryUrl ?? ""),
      coverStyle: String(value.coverStyle ?? "blue"), tags: value.tags ?? [],
      visibility: String(value.visibility ?? "PRIVATE"), publicSummary: value.publicSummary ?? null,
      createdAt: new Date(String(value.createdAt)).toISOString(),
      updatedAt: row.updatedAt.toISOString() };
  }
  if (collection === "reviews") {
    const fields = ["id", "type", "date", "summary", "achievement", "problem", "plan", "relatedProjectId"];
    return Object.fromEntries(fields.filter((field) => row.columns[field] !== null && row.columns[field] !== undefined)
      .map((field) => [field, row.columns[field]]));
  }
  throw new Error(`Server row ${collection}:${row.id} has no business payload.`);
}

function entityResult(collection: MigrationCollection, row: StoredEntity): EntityMutationResult {
  const createdAt = row.columns.createdAt;
  const createdAtIso = typeof createdAt === "string" ? new Date(
    /(?:Z|[+-]\d{2}:\d{2})$/.test(createdAt) ? createdAt : `${createdAt}Z`,
  ).toISOString() : undefined;
  return { collection, id: row.id, item: payloadOf(collection, row), version: row.version,
    ...(createdAtIso ? { createdAt: createdAtIso } : {}), updatedAt: row.updatedAt.toISOString() };
}

function normalizeInput(collection: MigrationCollection, value: unknown, id?: string): Item {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ApiError(400, "记录必须是对象。");
  const item = { ...(value as Item) };
  const entityId = id ?? item.id;
  if (typeof entityId !== "string" || !entityId || entityId.length > 300 ||
    (id && item.id !== undefined && item.id !== id)) throw new ApiError(400, "记录 ID 无效或与路径不一致。");
  item.id = entityId;
  if (collection === "projects") {
    item.tags ??= [];
    item.visibility ??= "PRIVATE";
    item.publicSummary ??= null;
  }
  for (const field of requiredText[collection] ?? []) {
    if (typeof item[field] !== "string" || !(item[field] as string).trim()) {
      throw new ApiError(422, `${collection}.${field} 不能为空。`);
    }
  }
  if (collection === "reviews" && !["DAILY", "WEEKLY", "MONTHLY", "PROJECT"].includes(String(item.type))) {
    throw new ApiError(422, "总结类型无效。");
  }
  if (collection === "reviews" && item.type === "PROJECT" && !item.relatedProjectId) {
    throw new ApiError(422, "项目复盘必须关联项目。");
  }
  if (collection === "reviews") {
    item.achievement ??= "";
    item.problem ??= "";
    item.plan ??= "";
    if (!item.relatedProjectId) delete item.relatedProjectId;
  }
  if (collection === "tasks") {
    if (!["PROJECT", "COURSE", "LEARNING", "PERSONAL"].includes(String(item.sourceType))) {
      throw new ApiError(422, "任务来源类型无效。");
    }
    if (["PROJECT", "COURSE"].includes(String(item.sourceType)) && !item.relatedId) {
      throw new ApiError(422, "项目或课程任务必须关联来源记录。");
    }
    if (item.priority !== undefined && !["高", "中", "低"].includes(String(item.priority))) {
      throw new ApiError(422, "任务优先级无效。");
    }
  }
  if (collection === "courses" && (!["MAJOR", "GENERAL"].includes(String(item.type)) ||
    !["PLANNED", "IN_PROGRESS", "COMPLETED", "ARCHIVED"].includes(String(item.status)))) {
    throw new ApiError(422, "课程类型或状态无效。");
  }
  if (collection === "projects" && !["PRIVATE", "PUBLIC"].includes(String(item.visibility))) {
    throw new ApiError(422, "项目可见性无效。");
  }
  if (collection === "knowledge") {
    const experienceIssues = experienceValidationIssues(item);
    if (experienceIssues.length) throw new ApiError(422, experienceIssues.join("；"));
  }
  if (collection === "financeTransactions" && Number(item.amount) <= 0) {
    throw new ApiError(422, "金额必须大于零。");
  }
  if (collection === "assignments" && (typeof item.deadline !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(item.deadline) ||
    Number.isNaN(new Date(`${item.deadline}T00:00:00.000Z`).getTime()) ||
    new Date(`${item.deadline}T00:00:00.000Z`).toISOString().slice(0, 10) !== item.deadline)) {
    throw new ApiError(422, "作业截止日期必须是有效的本地 YYYY-MM-DD。");
  }
  if (collection === "tasks" && item.deadline !== undefined &&
    (typeof item.deadline !== "string" || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(item.deadline) ||
      Number.isNaN(Date.parse(item.deadline)))) {
    throw new ApiError(422, "任务截止时间必须是带时区的 ISO 8601 时间。");
  }
  if (collection === "contentStates" && !mockContentItems.some((entry) => entry.id === entityId)) {
    throw new ApiError(422, "内容目录中没有该条目。");
  }
  if (collection === "calendarEvents" && item.sourceType !== "manual") {
    throw new ApiError(422, "派生日程由来源记录生成，不能单独写入。");
  }
  const issues = migrationValueIssues(collection, item);
  if (issues.length) throw new ApiError(422, issues.join("；"));
  if (collection === "reviews") {
    item.date = canonicalReflectionDate(item.type as "DAILY" | "WEEKLY" | "MONTHLY" | "PROJECT", String(item.date));
  }
  return item;
}

async function validateRelations(
  tx: Prisma.TransactionClient, workspaceId: string,
  collection: MigrationCollection, item: Item,
): Promise<MigrationRelation[]> {
  const refs = migrationRelations(collection, item);
  if (collection === "attachments" && !refs.some((ref) => ref.field === "relatedId")) {
    throw new ApiError(422, "附件关联类型无效。");
  }
  if (collection === "reports" && Array.isArray(item.sourceRefs)) {
    const candidates: MigrationCollection[] = ["tasks", "engineeringLogs", "experiments", "technicalIssues", "knowledge"];
    for (const sourceId of item.sourceRefs) {
      if (typeof sourceId !== "string") throw new ApiError(422, "报告来源 ID 无效。");
      const matches: MigrationCollection[] = [];
      for (const candidate of candidates) {
        if (await findEntity(tx, workspaceId, candidate, sourceId)) matches.push(candidate);
      }
      if (matches.length !== 1) throw new ApiError(422, `报告来源 ${sourceId} 不存在或不唯一。`);
      refs.push({ field: "sourceRefs", collection: matches[0], id: sourceId });
    }
  }
  for (const ref of refs) {
    if (ref.collection === collection && ref.id === item.id) throw new ApiError(422, "记录不能关联自身。");
    if (!(await findEntity(tx, workspaceId, ref.collection, ref.id))) {
      throw new ApiError(422, `${ref.field} 指向不存在的 ${ref.collection}:${ref.id}。`);
    }
  }
  return refs;
}

function extractDomain(snapshot: ServerWorkspaceSnapshot, collection: MigrationCollection, items: Item[]): void {
  const domain = snapshot.domain;
  if (collection === "contentStates") {
    for (const item of items) snapshot.contentStates[String(item.id)] = {
      status: item.status as ServerWorkspaceSnapshot["contentStates"][string]["status"],
      isFavorite: Boolean(item.isFavorite), isInKnowledgeBase: Boolean(item.isInKnowledgeBase),
      isInStudyPlan: Boolean(item.isInStudyPlan),
    };
  } else if (collection in domain.academic) {
    const key = collection as keyof WorkspaceDomainState["academic"];
    (domain.academic as unknown as Record<string, Item[]>)[key] = items;
  } else if (collection in domain.legacy) {
    const key = collection as keyof WorkspaceDomainState["legacy"];
    (domain.legacy as unknown as Record<string, Item[]>)[key] = items;
  } else {
    (domain as unknown as Record<string, Item[]>)[collection] = items;
  }
}

export const serverWorkspaceEntityService = {
  async snapshot(workspaceId: string): Promise<ServerWorkspaceSnapshot> {
    return prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
      const domain = migrateWorkspaceV3(createEmptyWorkspaceData(), workspace.createdAt);
      domain.metadata = { schemaVersion: 4, createdAt: workspace.createdAt.toISOString(),
        updatedAt: workspace.updatedAt.toISOString() };
      const result: ServerWorkspaceSnapshot = { domain, contentStates: {}, versions: {},
        migrationBatchCount: await tx.migrationBatch.count({ where: { workspaceId } }), hasServerRecords: false };
      for (const collection of MIGRATION_COLLECTIONS) {
        const rows = await listEntities(tx, workspaceId, collection);
        if (rows.length) result.hasServerRecords = true;
        for (const row of rows) result.versions[`${collection}:${row.id}`] = row.version;
        extractDomain(result, collection, rows.map((row) => payloadOf(collection, row)));
      }
      return result;
    });
  },

  async create(workspaceId: string, collection: MigrationCollection, input: unknown): Promise<EntityMutationResult> {
    const item = normalizeInput(collection, input);
    return prisma.$transaction(async (tx) => {
      if (await findEntity(tx, workspaceId, collection, String(item.id))) throw new ApiError(409, "记录 ID 已存在。");
      const refs = await validateRelations(tx, workspaceId, collection, item);
      const row = await insertEntity(tx, workspaceId, collection, item, refs, new Date());
      if (collection === "engineeringLogs" && typeof item.taskId === "string" && item.taskId) {
        const task = await findEntity(tx, workspaceId, "tasks", item.taskId);
        if (!task) throw new ApiError(422, "关联任务不存在。");
        const previous = payloadOf("tasks", task);
        const minutes = Number(item.durationMinutes);
        if (!Number.isFinite(minutes) || minutes <= 0) throw new ApiError(422, "工程日志时长必须大于零。");
        const actualHours = Math.round((Number(previous.actualHours ?? 0) + minutes / 60) * 100) / 100;
        const updated = { ...previous, actualHours, updatedAt: new Date().toISOString() };
        const parent = await updateEntity(tx, workspaceId, "tasks", task.id, task.version, updated,
          migrationRelations("tasks", updated), new Date());
        if (!parent) throw new ApiError(409, "关联任务已在其他设备修改；工程日志未保存，请重新加载后重试。");
      }
      if (collection === "skillEvidence") {
        const skill = await findEntity(tx, workspaceId, "skills", String(item.skillId));
        if (!skill) throw new ApiError(422, "关联技能不存在。");
        const previous = payloadOf("skills", skill);
        const scoreChange = Number(item.scoreChange);
        if (!Number.isFinite(scoreChange)) throw new ApiError(422, "技能分数变化无效。");
        const score = Math.min(100, Math.max(0, Math.round(Number(previous.score ?? 0) + scoreChange)));
        const updated = { ...previous, score, level: Math.max(1, Math.ceil(score / 20)),
          updatedAt: new Date().toISOString() };
        const parent = await updateEntity(tx, workspaceId, "skills", skill.id, skill.version, updated,
          migrationRelations("skills", updated), new Date());
        if (!parent) throw new ApiError(409, "关联技能已在其他设备修改；技能证据未保存，请重新加载后重试。");
      }
      if (collection === "studySessions") {
        const planId = String(item.studyPlanId);
        const plan = await findEntity(tx, workspaceId, "studyPlans", planId);
        if (!plan) throw new ApiError(422, "学习计划不存在。");
        const previous = payloadOf("studyPlans", plan);
        const minutes = Number(item.durationMinutes);
        if (!Number.isFinite(minutes) || minutes <= 0) throw new ApiError(422, "学习时长必须大于零。");
        const completedHours = Math.round((Number(previous.completedHours ?? 0) + minutes / 60) * 100) / 100;
        const progress = Math.min(100, Math.round(completedHours / Math.max(Number(previous.targetHours ?? 0), 0.1) * 100));
        const parent = await updateEntity(tx, workspaceId, "studyPlans", planId, plan.version,
          { ...previous, completedHours, progress, status: progress >= 100 ? "已完成" : "进行中",
            updatedAt: new Date().toISOString() }, migrationRelations("studyPlans", previous), new Date());
        if (!parent) throw new ApiError(409, "关联学习计划已在其他设备修改；学习记录未保存，请重新加载后重试。");
      }
      return entityResult(collection, row);
    });
  },

  async update(workspaceId: string, collection: MigrationCollection, id: string,
    version: number, input: unknown): Promise<EntityMutationResult> {
    return prisma.$transaction(async (tx) => {
      const current = await findEntity(tx, workspaceId, collection, id);
      if (!current) throw new ApiError(404, "记录不存在。");
      if (current.version !== version) throw new ApiError(409, "记录已在其他设备修改，请重新加载后重试。");
      if (!input || typeof input !== "object" || Array.isArray(input)) throw new ApiError(400, "更新内容必须是对象。");
      const item = normalizeInput(collection, { ...payloadOf(collection, current), ...(input as Item), id }, id);
      if (collection === "knowledge") {
        const previous = payloadOf(collection, current);
        const oldExperience = previous.experience as Item | undefined;
        const newExperience = item.experience as Item | undefined;
        if (oldExperience?.sourceKey && (newExperience?.sourceKey !== oldExperience.sourceKey ||
          newExperience?.sourceRevision !== oldExperience.sourceRevision || item.sourceId !== previous.sourceId)) {
          throw new ApiError(422, "共享来源标识与版本不可由编辑操作改写。");
        }
      }
      if ("updatedAt" in item) item.updatedAt = new Date().toISOString();
      const refs = await validateRelations(tx, workspaceId, collection, item);
      const row = await updateEntity(tx, workspaceId, collection, id, version, item, refs, new Date());
      if (!row) throw new ApiError(409, "记录已在其他设备修改，请重新加载后重试。");
      return entityResult(collection, row);
    });
  },

  async get(workspaceId: string, collection: MigrationCollection, id: string): Promise<EntityMutationResult> {
    return prisma.$transaction(async (tx) => {
      const row = await findEntity(tx, workspaceId, collection, id);
      if (!row) throw new ApiError(404, "记录不存在。");
      return entityResult(collection, row);
    });
  },

  async delete(workspaceId: string, collection: MigrationCollection, id: string,
    version: number): Promise<EntityMutationResult> {
    return prisma.$transaction(async (tx) => {
      const current = await findEntity(tx, workspaceId, collection, id);
      if (!current) throw new ApiError(404, "记录不存在。");
      if (current.version !== version) throw new ApiError(409, "记录已在其他设备修改，请重新加载后重试。");
      const target = JSON.stringify([{ collection, id }]);
      for (const dependent of MIGRATION_COLLECTIONS) {
        const table = MIGRATION_TABLES[dependent].table;
        const references = await tx.$queryRawUnsafe<Array<{ id: string }>>(
          `SELECT "id" FROM "${table}" WHERE "workspaceId" = $1 AND "relationRefs" @> $2::jsonb LIMIT 1`,
          workspaceId, target,
        );
        if (references.length) throw new ApiError(409, `${dependent}:${references[0].id} 仍关联此记录，不能删除。`);
      }
      if (collection === "projects" && await tx.review.count({ where: { workspaceId, relatedProjectId: id } })) {
        throw new ApiError(409, "项目仍有关联总结，不能删除。");
      }
      if (collection === "reviews" && await tx.attachment.count({ where: {
        workspaceId, relatedType: "REVIEW", relatedId: id,
      } })) throw new ApiError(409, "复盘仍有关联附件，不能删除。");
      if (!(await deleteEntity(tx, workspaceId, collection, id, version))) {
        throw new ApiError(409, "记录已在其他设备修改，请重新加载后重试。");
      }
      return { collection, id };
    });
  },
};
