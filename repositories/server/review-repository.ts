import type { Prisma, Review as PrismaReview } from "@prisma/client";

import { ApiError } from "@/lib/server/api-response";
import { formatDateOnly, parseDateOnly } from "@/lib/server/calendar-date";
import { prisma } from "@/lib/server/prisma";
import type { ReviewCreate, ReviewQuery, ServerReview } from "@/types/server-review";

function toDto(row: PrismaReview): ServerReview {
  return {
    id: row.id, type: row.type, date: formatDateOnly(row.date), summary: row.summary,
    achievement: row.achievement, problem: row.problem, plan: row.plan,
    relatedProjectId: row.relatedProjectId ?? undefined, version: row.version,
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
  };
}

async function assertProject(tx: Prisma.TransactionClient, workspaceId: string, projectId?: string): Promise<void> {
  if (!projectId) return;
  const project = await tx.project.findFirst({ where: { id: projectId, workspaceId }, select: { id: true } });
  if (!project) throw new ApiError(422, "关联项目不存在或不属于当前工作台。");
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
    return prisma.$transaction(async (tx) => {
      await assertProject(tx, workspaceId, draft.relatedProjectId);
      const row = await tx.review.create({ data: {
        workspaceId, type: draft.type, date: parseDateOnly(draft.date), summary: draft.summary,
        achievement: draft.achievement, problem: draft.problem, plan: draft.plan,
        relatedProjectId: draft.relatedProjectId,
      } });
      return toDto(row);
    });
  },
  async update(workspaceId: string, id: string, version: number, draft: ReviewCreate): Promise<ServerReview> {
    return prisma.$transaction(async (tx) => {
      await assertProject(tx, workspaceId, draft.relatedProjectId);
      const changed = await tx.review.updateMany({
        where: { id, workspaceId, version },
        data: { type: draft.type, date: parseDateOnly(draft.date), summary: draft.summary,
          achievement: draft.achievement, problem: draft.problem, plan: draft.plan,
          relatedProjectId: draft.relatedProjectId ?? null, version: { increment: 1 } },
      });
      if (!changed.count) {
        const exists = await tx.review.findFirst({ where: { id, workspaceId }, select: { id: true } });
        throw new ApiError(exists ? 409 : 404, exists ? "记录已在其他设备修改，请刷新后重试。" : "总结不存在。");
      }
      const row = await tx.review.findFirstOrThrow({ where: { id, workspaceId } });
      return toDto(row);
    });
  },
  async delete(workspaceId: string, id: string, version: number): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const linked = await tx.attachment.count({ where: { workspaceId, relatedType: "REVIEW", relatedId: id } });
      if (linked) throw new ApiError(409, "复盘仍有关联附件，不能删除。");
      const removed = await tx.review.deleteMany({ where: { id, workspaceId, version } });
      if (!removed.count) {
        const exists = await tx.review.findFirst({ where: { id, workspaceId }, select: { id: true } });
        throw new ApiError(exists ? 409 : 404, exists ? "记录已在其他设备修改，请刷新后重试。" : "总结不存在。");
      }
    });
  },
};
