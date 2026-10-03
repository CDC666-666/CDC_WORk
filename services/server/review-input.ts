import { ApiError } from "@/lib/server/api-response";
import { canonicalReviewDate, formatDateOnly, parseDateOnly } from "@/lib/server/calendar-date";
import type { ReviewType } from "@/types/review";
import type { ReviewCreate, ReviewPatch, ReviewQuery } from "@/types/server-review";

const types: ReviewType[] = ["DAILY", "WEEKLY", "MONTHLY", "PROJECT"];
const fields = ["type", "date", "summary", "achievement", "problem", "plan", "relatedProjectId"] as const;

function textField(value: unknown, key: string, maxLength = 100_000): string {
  if (typeof value !== "string" || value.length > maxLength) throw new ApiError(400, `${key} 必须是有效文本。`);
  return value;
}

function typeField(value: unknown): ReviewType {
  if (typeof value !== "string" || !types.includes(value as ReviewType)) throw new ApiError(400, "总结类型无效。");
  return value as ReviewType;
}

function projectField(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return textField(value, "relatedProjectId", 200);
}

function allowedKeys(input: Record<string, unknown>, allowed: readonly string[]): void {
  if (Object.keys(input).some((key) => !allowed.includes(key))) throw new ApiError(400, "请求包含不支持的字段。");
}

export function parseReviewCreate(input: Record<string, unknown>): ReviewCreate {
  allowedKeys(input, fields);
  const type = typeField(input.type);
  const date = textField(input.date, "date", 10);
  let canonical: string;
  try { canonical = formatDateOnly(canonicalReviewDate(type, date)); }
  catch { throw new ApiError(400, "日期必须是有效的 YYYY-MM-DD。"); }
  const summary = textField(input.summary, "summary").trim();
  if (!summary) throw new ApiError(400, "请填写总结内容。");
  const relatedProjectId = projectField(input.relatedProjectId);
  if (type === "PROJECT" && !relatedProjectId) throw new ApiError(400, "项目复盘必须关联现有项目。");
  return {
    type, date: canonical, summary,
    achievement: textField(input.achievement, "achievement"),
    problem: textField(input.problem, "problem"),
    plan: textField(input.plan, "plan"),
    relatedProjectId,
  };
}

export function parseReviewPatch(input: Record<string, unknown>): ReviewPatch {
  allowedKeys(input, [...fields, "version"]);
  if (!Number.isSafeInteger(input.version) || Number(input.version) < 1) throw new ApiError(400, "必须提供有效的版本号。");
  if (!Object.keys(input).some((key) => key !== "version")) throw new ApiError(400, "没有需要更新的字段。");
  const patch: ReviewPatch = { version: Number(input.version) };
  if (input.type !== undefined) patch.type = typeField(input.type);
  if (input.date !== undefined) {
    const date = textField(input.date, "date", 10);
    try { parseDateOnly(date); } catch { throw new ApiError(400, "日期必须是有效的 YYYY-MM-DD。"); }
    patch.date = date;
  }
  for (const key of ["summary", "achievement", "problem", "plan"] as const) {
    if (input[key] !== undefined) patch[key] = textField(input[key], key);
  }
  if (input.relatedProjectId !== undefined) patch.relatedProjectId = projectField(input.relatedProjectId);
  return patch;
}

export function parseReviewQuery(params: URLSearchParams): ReviewQuery {
  const query: ReviewQuery = {};
  if (params.has("type")) query.type = typeField(params.get("type"));
  if (params.has("relatedProjectId")) query.relatedProjectId = textField(params.get("relatedProjectId"), "relatedProjectId", 200);
  for (const key of ["dateFrom", "dateTo"] as const) {
    if (!params.has(key)) continue;
    const value = textField(params.get(key), key, 10);
    try { parseDateOnly(value); } catch { throw new ApiError(400, `${key} 必须是有效的 YYYY-MM-DD。`); }
    query[key] = value;
  }
  if (query.dateFrom && query.dateTo && query.dateFrom > query.dateTo) throw new ApiError(400, "开始日期不能晚于结束日期。");
  return query;
}
