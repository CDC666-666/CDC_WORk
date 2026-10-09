import { randomUUID } from "node:crypto";
import type { Review as PrismaReview } from "@prisma/client";

import { formatDateOnly, parseDateOnly } from "@/lib/server/calendar-date";
import { prisma } from "@/lib/server/prisma";
import { serverWorkspaceEntityService } from "@/services/server/workspace-entity-service";
import type { ReviewType } from "@/types/review";
import type { EntityMutationResult } from "@/types/server-workspace";
import type { ReviewCreate, ReviewQuery, ServerReview } from "@/types/server-review";

function toDto(row: PrismaReview): ServerReview {
  return {
    id: row.id, type: row.type, date: formatDateOnly(row.date), summary: row.summary,
    achievement: row.achievement, problem: row.problem, plan: row.plan,
    relatedProjectId: row.relatedProjectId ?? undefined, version: row.version,
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
  };
}

function fromEntity(result: EntityMutationResult): ServerReview {
  const item = result.item;
  if (!item || result.version === undefined || !result.createdAt || !result.updatedAt) {
    throw new Error("已提交的总结缺少返回字段。");
  }
  return { id: result.id, type: item.type as ReviewType, date: String(item.date),
    summary: String(item.summary), achievement: String(item.achievement ?? ""),
    problem: String(item.problem ?? ""), plan: String(item.plan ?? ""),
    relatedProjectId: typeof item.relatedProjectId === "string" ? item.relatedProjectId : undefined,
    version: result.version, createdAt: result.createdAt, updatedAt: result.updatedAt };
}

export const serverReviewRepository = {
  async list(workspaceId: string, query: ReviewQuery = {}): Promise<ServerReview[]> {
    const rows = await prisma.review.findMany({
      where: {
        workspaceId,
        ...(query.id ? { id: query.id } : {}),
        ...(query.type ? { type: query.type } : {}),
        ...(query.relatedProjectId ? { relatedProjectId: query.relatedProjectId } : {}),
        ...(query.dateFrom || query.dateTo ? { date: {
          ...(query.dateFrom ? { gte: parseDateOnly(query.dateFrom) } : {}),
          ...(query.dateTo ? { lte: parseDateOnly(query.dateTo) } : {}),
        } } : {}),
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
    return rows.map(toDto);
  },
  async get(workspaceId: string, id: string): Promise<ServerReview | null> {
    const row = await prisma.review.findFirst({ where: { id, workspaceId } });
    return row ? toDto(row) : null;
  },
  async create(workspaceId: string, draft: ReviewCreate): Promise<ServerReview> {
    const id = randomUUID();
    return fromEntity(await serverWorkspaceEntityService.create(workspaceId, "reviews", { id, ...draft }));
  },
  async update(workspaceId: string, id: string, version: number, draft: ReviewCreate): Promise<ServerReview> {
    return fromEntity(await serverWorkspaceEntityService.update(workspaceId, "reviews", id, version, draft));
  },
  async delete(workspaceId: string, id: string, version: number): Promise<void> {
    await serverWorkspaceEntityService.delete(workspaceId, "reviews", id, version);
  },
};
