import { randomUUID } from "node:crypto";

import type { NextRequest } from "next/server";

import { ApiError, apiFailure, privateJson, readJsonObject } from "@/lib/server/api-response";
import { assertSameOrigin, requirePrivateApi } from "@/lib/server/private-api";
import { prisma } from "@/lib/server/prisma";

/** Minimal server project endpoint for linking new reviews; existing project UI remains local in 5.1. */
export async function GET() {
  try {
    const { workspaceId } = await requirePrivateApi();
    const items = await prisma.project.findMany({ where: { workspaceId },
      select: { id: true, name: true, visibility: true }, orderBy: { name: "asc" } });
    return privateJson({ items });
  } catch (cause: unknown) { return apiFailure(cause); }
}

export async function POST(request: NextRequest) {
  try {
    const { workspaceId } = await requirePrivateApi();
    assertSameOrigin(request);
    const input = await readJsonObject(request);
    if (Object.keys(input).some((key) => key !== "name")) throw new ApiError(400, "仅支持填写项目名称。");
    if (typeof input.name !== "string" || !input.name.trim() || input.name.length > 200) {
      throw new ApiError(400, "请填写有效的项目名称。");
    }
    const item = await prisma.project.create({ data: { id: `project-${randomUUID()}`, workspaceId,
      name: input.name.trim() }, select: { id: true, name: true, visibility: true } });
    return privateJson({ item }, 201);
  } catch (cause: unknown) { return apiFailure(cause); }
}
