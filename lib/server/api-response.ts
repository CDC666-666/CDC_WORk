import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

export function privateJson(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function apiFailure(cause: unknown): NextResponse {
  if (cause instanceof ApiError) return privateJson({ error: cause.message }, cause.status);
  if (cause instanceof Prisma.PrismaClientKnownRequestError) {
    if (cause.code === "P2003") return privateJson({ error: "关联记录已变化，请刷新后重试。" }, 409);
    if (cause.code === "P2002") return privateJson({ error: "记录已存在，请刷新后重试。" }, 409);
    if (cause.code === "P2025") return privateJson({ error: "记录不存在。" }, 404);
  }
  console.error("Private API failure", cause);
  return privateJson({ error: "服务器操作失败，请稍后重试。" }, 500);
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  const raw = await request.text();
  if (raw.length > 64_000) throw new ApiError(413, "请求内容过大。");
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new ApiError(400, "请求 JSON 无效。"); }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ApiError(400, "请求内容必须是对象。");
  return value as Record<string, unknown>;
}
