import { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { ApiError, apiFailure, privateJson, readJsonObject } from "@/lib/server/api-response";
import { assertSameOrigin, requirePrivateApi } from "@/lib/server/private-api";
import { prisma } from "@/lib/server/prisma";

const defaults = [
  ["生活", "#2563eb"], ["学习", "#7c3aed"], ["交通", "#0d9488"], ["设备", "#f59e0b"],
  ["RoboMaster", "#e11d48"], ["项目", "#6366f1"], ["娱乐", "#ec4899"],
  ["奖学金", "#16a34a"], ["兼职", "#0891b2"], ["餐饮", "#f97316"],
  ["日用品", "#64748b"], ["购物", "#db2777"], ["医疗", "#ef4444"],
  ["电子元器件", "#ea580c"], ["工具设备", "#a16207"], ["网站服务", "#4f46e5"],
  ["其他", "#94a3b8"], ["未分类", "#64748b"],
] as const;
function name(value: unknown): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 40) throw new ApiError(422, "分类名称须为 1–40 字符。");
  return value.trim();
}
function color(value: unknown): string {
  if (typeof value !== "string" || !/^#[0-9a-fA-F]{6}$/.test(value)) throw new ApiError(422, "分类颜色须为六位十六进制色值。");
  return value.toLowerCase();
}

export async function GET() {
  try {
    const { workspaceId } = await requirePrivateApi();
    const categories = await prisma.$transaction(async (tx) => {
      const existing = await tx.financeCategorySetting.findMany({ where: { workspaceId }, orderBy: { name: "asc" } });
      if (existing.length) return existing;
      const rows = await tx.financeTransaction.findMany({ where: { workspaceId }, select: { payload: true } });
      const historical = rows.map((row) => (row.payload as { category?: unknown }).category)
        .filter((value): value is string => typeof value === "string" && Boolean(value.trim()));
      const initial = new Map<string, string>(defaults.map(([key, value]) => [key, value]));
      for (const value of historical) if (!initial.has(value)) initial.set(value, "#64748b");
      await tx.financeCategorySetting.createMany({ data: [...initial].map(([category, shade]) =>
        ({ workspaceId, name: category, color: shade })), skipDuplicates: true });
      return tx.financeCategorySetting.findMany({ where: { workspaceId }, orderBy: { name: "asc" } });
    });
    return privateJson({ categories: categories.map(({ name, color }) => ({ name, color })) });
  } catch (cause: unknown) { return apiFailure(cause); }
}

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const { workspaceId } = await requirePrivateApi();
    const body = await readJsonObject(request);
    const category = await prisma.financeCategorySetting.create({ data: { workspaceId,
      name: name(body.name), color: color(body.color) } });
    return privateJson({ category: { name: category.name, color: category.color } }, 201);
  } catch (cause: unknown) { return apiFailure(cause); }
}

export async function PATCH(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const { workspaceId } = await requirePrivateApi();
    const body = await readJsonObject(request);
    const previous = name(body.previous);
    const next = name(body.name);
    const shade = color(body.color);
    await prisma.$transaction(async (tx) => {
      const category = await tx.financeCategorySetting.findUnique({ where: { workspaceId_name: { workspaceId, name: previous } } });
      if (!category) throw new ApiError(404, "分类不存在。");
      await tx.financeCategorySetting.update({ where: { id: category.id }, data: { name: next, color: shade } });
      if (next !== previous) {
        const rows = await tx.financeTransaction.findMany({ where: { workspaceId }, select: { id: true, payload: true } });
        for (const row of rows) {
          const payload = row.payload as Record<string, unknown>;
          if (payload.category === previous) await tx.financeTransaction.update({ where: { id: row.id },
            data: { payload: { ...payload, category: next } as Prisma.InputJsonObject } });
        }
      }
    });
    return privateJson({ category: { name: next, color: shade } });
  } catch (cause: unknown) { return apiFailure(cause); }
}

export async function DELETE(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const { workspaceId } = await requirePrivateApi();
    const body = await readJsonObject(request);
    const previous = name(body.name);
    const target = name(body.migrateTo ?? "未分类");
    if (previous === target) throw new ApiError(422, "迁移目标不能与删除分类相同。");
    await prisma.$transaction(async (tx) => {
      const category = await tx.financeCategorySetting.findUnique({ where: { workspaceId_name: { workspaceId, name: previous } } });
      if (!category) throw new ApiError(404, "分类不存在。");
      const rows = await tx.financeTransaction.findMany({ where: { workspaceId }, select: { id: true, payload: true } });
      const used = rows.filter((row) => (row.payload as { category?: unknown }).category === previous);
      if (used.length && !(await tx.financeCategorySetting.findUnique({ where: { workspaceId_name: { workspaceId, name: target } } }))) {
        if (target !== "未分类") throw new ApiError(422, "迁移目标分类不存在。");
        await tx.financeCategorySetting.create({ data: { workspaceId, name: target, color: "#64748b" } });
      }
      for (const row of used) {
        await tx.financeTransaction.update({ where: { id: row.id }, data: {
          payload: { ...(row.payload as Record<string, unknown>), category: target } as Prisma.InputJsonObject,
          version: { increment: 1 },
        } });
      }
      await tx.financeCategorySetting.delete({ where: { id: category.id } });
    });
    return privateJson({ deleted: previous, migratedTo: target });
  } catch (cause: unknown) { return apiFailure(cause); }
}
