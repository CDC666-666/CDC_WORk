import type { NextRequest } from "next/server";
import { ApiError, apiFailure, privateJson } from "@/lib/server/api-response";
import { requirePrivateApi } from "@/lib/server/private-api";
import { prisma } from "@/lib/server/prisma";
import { toBeijingDateKey } from "@/lib/date";
import { analyzeFinance, monthStart, validDateKey, type FinanceFilters, type FinanceSort,
  type FinanceTrendUnit } from "@/services/finance-analysis";
import type { FinanceTransaction } from "@/types/finance";

const sorts: FinanceSort[] = ["date-desc", "date-asc", "amount-desc", "amount-asc"];
const units: FinanceTrendUnit[] = ["day", "week", "month"];
function cents(value: string | null): number | undefined {
  if (!value) return undefined;
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) throw new ApiError(400, "金额筛选须为最多两位小数的非负数字。");
  const [whole, decimal = ""] = value.split(".");
  const result = Number(whole) * 100 + Number(decimal.padEnd(2, "0"));
  if (!Number.isSafeInteger(result)) throw new ApiError(400, "金额筛选过大。");
  return result;
}

export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await requirePrivateApi();
    const params = request.nextUrl.searchParams;
    const today = toBeijingDateKey();
    const start = params.get("start") ?? monthStart(today);
    const end = params.get("end") ?? today;
    if (!validDateKey(start) || !validDateKey(end) || start > end ||
      Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`) > 30 * 366 * 86_400_000) {
      throw new ApiError(400, "日期范围无效或超过三十年。");
    }
    const sort = params.get("sort") ?? "date-desc";
    const trendUnit = params.get("trendUnit") ?? "day";
    const page = Number(params.get("page") ?? "1");
    const pageSize = Number(params.get("pageSize") ?? "20");
    if (!sorts.includes(sort as FinanceSort) || !units.includes(trendUnit as FinanceTrendUnit) ||
      !Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      throw new ApiError(400, "分页或排序条件无效。");
    }
    const query = params.get("q")?.trim() ?? "";
    const type = params.get("type") ?? "";
    const category = params.get("category") ?? "";
    const account = params.get("account") ?? "";
    if ([query, category, account].some((value) => value.length > 100) || !["", "收入", "支出", "转账"].includes(type)) {
      throw new ApiError(400, "筛选条件无效。");
    }
    const minCents = cents(params.get("min"));
    const maxCents = cents(params.get("max"));
    if (minCents !== undefined && maxCents !== undefined && minCents > maxCents) throw new ApiError(400, "最低金额不能大于最高金额。");
    const filters: FinanceFilters = { start, end, query, type, category, account, minCents, maxCents,
      sort: sort as FinanceSort, trendUnit: trendUnit as FinanceTrendUnit, page, pageSize };
    // The workspace scope is enforced in SQL before any search, grouping or pagination.
    const rows = await prisma.financeTransaction.findMany({ where: { workspaceId }, select: { payload: true } });
    const transactions = rows.map((row) => row.payload as unknown as FinanceTransaction);
    return privateJson(analyzeFinance(transactions, filters, today));
  } catch (cause: unknown) { return apiFailure(cause); }
}
