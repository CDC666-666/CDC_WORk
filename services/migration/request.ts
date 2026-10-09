import { ApiError } from "@/lib/server/api-response";
import { parseIncludeIds, parseRawMigrationInput } from "@/services/migration/migration-service";

const MAX_BYTES = 20 * 1024 * 1024;

export async function readMigrationRequest(request: Request): Promise<{
  raw: ReturnType<typeof parseRawMigrationInput>;
  includeIds: string[];
  previewDigest?: string;
}> {
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "请求内容为空。");
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_BYTES) {
      await reader.cancel();
      throw new ApiError(413, "迁移原文超过 20 MiB；请先离线拆分并核对。");
    }
    chunks.push(value);
  }
  let body: unknown;
  try { body = JSON.parse(new TextDecoder().decode(Buffer.concat(chunks))) as unknown; }
  catch { throw new ApiError(400, "请求 JSON 无效。"); }
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new ApiError(400, "请求必须是对象。");
  const input = body as Record<string, unknown>;
  if (input.previewDigest !== undefined && typeof input.previewDigest !== "string") {
    throw new ApiError(400, "预览校验值无效。");
  }
  return { raw: parseRawMigrationInput(input.raw), includeIds: parseIncludeIds(input.includeIds),
    previewDigest: input.previewDigest as string | undefined };
}
