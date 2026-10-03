import type { NextRequest } from "next/server";

import { ApiError } from "@/lib/server/api-response";
import { getPrivateWorkspace, type PrivateWorkspace } from "@/lib/server/auth";

export async function requirePrivateApi(): Promise<PrivateWorkspace> {
  const context = await getPrivateWorkspace();
  if (!context) throw new ApiError(401, "请先使用允许的 GitHub 账号登录。");
  return context;
}

export function assertSameOrigin(request: NextRequest): void {
  const origin = request.headers.get("origin");
  const expected = process.env.NEXTAUTH_URL;
  if (!origin || !expected || origin !== new URL(expected).origin) {
    throw new ApiError(403, "请求来源无效。");
  }
}

export function parseVersionHeader(request: NextRequest): number {
  const value = request.headers.get("if-match");
  const match = value?.match(/^"([1-9]\d*)"$/);
  if (!match || !Number.isSafeInteger(Number(match[1]))) throw new ApiError(400, "删除时必须提供 If-Match 版本号。");
  return Number(match[1]);
}
