import type { NextRequest } from "next/server";
import { ApiError, apiFailure, privateJson } from "@/lib/server/api-response";
import { prisma } from "@/lib/server/prisma";
import { assertSameOrigin, requirePrivateApi } from "@/lib/server/private-api";
import type { WorkspaceBranding } from "@/types/workspace-branding";

const fields = ["displayName", "bio", "avatar", "workspaceName", "workspaceSubtitle", "workspaceIcon"] as const;
type Field = typeof fields[number];

function branding(row: WorkspaceBranding): WorkspaceBranding {
  return Object.fromEntries(fields.map((key) => [key, row[key]])) as unknown as WorkspaceBranding;
}

export async function GET() {
  try {
    const { workspaceId } = await requirePrivateApi();
    const row = await prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
    return privateJson(branding(row));
  } catch (cause: unknown) { return apiFailure(cause); }
}

export async function PATCH(request: NextRequest) {
  try {
    const { workspaceId } = await requirePrivateApi();
    assertSameOrigin(request);
    const raw = await request.text();
    if (raw.length > 750_000) throw new ApiError(413, "图片或请求内容过大。每张图片裁剪后请控制在 256 KB 内。");
    let input: unknown;
    try { input = JSON.parse(raw); } catch { throw new ApiError(400, "设置内容无效。"); }
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new ApiError(400, "设置内容无效。");
    const values = input as Record<string, unknown>;
    if (Object.keys(values).some((key) => !fields.includes(key as Field))) throw new ApiError(400, "包含不支持的设置字段。");
    const patch: Partial<WorkspaceBranding> = {};
    for (const field of fields) {
      if (!(field in values)) continue;
      const value = values[field];
      if (field === "avatar" || field === "workspaceIcon") {
        if (value !== null && (typeof value !== "string" || value.length > 350_000 ||
          !/^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(value))) {
          throw new ApiError(400, "图片必须是裁剪后的 WebP、PNG 或 JPEG，且不超过 256 KB。");
        }
        patch[field] = value as string | null;
      } else {
        const limit = field === "bio" ? 160 : 60;
        if (typeof value !== "string" || value.length > limit ||
          (field !== "bio" && field !== "workspaceSubtitle" && !value.trim())) throw new ApiError(400, `${field} 无效或超过长度限制。`);
        patch[field] = value.trim();
      }
    }
    const row = await prisma.workspace.update({ where: { id: workspaceId }, data: patch });
    return privateJson(branding(row));
  } catch (cause: unknown) { return apiFailure(cause); }
}
