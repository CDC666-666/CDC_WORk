import type { FinanceTransaction } from "@/types/finance";

export type FinanceTrendUnit = "day" | "week" | "month";
export type FinanceSort = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";
export interface FinanceFilters {
  start: string; end: string; query: string; type: string; category: string; account: string;
  minCents?: number; maxCents?: number; sort: FinanceSort; page: number; pageSize: number;
  trendUnit: FinanceTrendUnit;
}
export interface FinanceAmountGroup { key: string; amountCents: number }
export interface FinanceReport {
  items: FinanceTransaction[]; totalCount: number; page: number; pageSize: number;
  incomeCents: number; expenseCents: number; balanceCents: number; dailyExpenseCents: number | null;
  trend: FinanceAmountGroup[]; categories: FinanceAmountGroup[];
  monthly: { key: string; incomeCents: number; expenseCents: number; categories: FinanceAmountGroup[] }[];
  accounts: string[]; allCount: number;
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
export function validDateKey(value: string): boolean {
  if (!datePattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function dateOffset(key: string, days: number): string {
  const date = new Date(`${key}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
export function monthStart(key: string, offset = 0): string {
  const date = new Date(`${key.slice(0, 7)}-01T00:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 10);
}
export function monthEnd(key: string): string { return dateOffset(monthStart(key, 1), -1); }
export function amountCents(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}
export function formatCents(value: number): string { return (value / 100).toFixed(2); }

function trendKey(date: string, unit: FinanceTrendUnit): string {
  if (unit === "day") return date;
  if (unit === "month") return date.slice(0, 7);
  const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay() || 7;
  return dateOffset(date, 1 - weekday);
}

export function analyzeFinance(transactions: FinanceTransaction[], filters: FinanceFilters, today: string): FinanceReport {
  const query = filters.query.trim().toLocaleLowerCase("zh-CN");
  const terms = query.split(/\s+/).filter(Boolean);
  const matched = transactions.filter((item) => {
    if (!validDateKey(item.date) || item.date < filters.start || item.date > filters.end) return false;
    if (filters.type && item.type !== filters.type || filters.category && item.category !== filters.category ||
      filters.account && item.account !== filters.account) return false;
    const cents = amountCents(item.amount);
    if (filters.minCents !== undefined && cents < filters.minCents ||
      filters.maxCents !== undefined && cents > filters.maxCents) return false;
    const haystack = [item.description, item.note ?? "", item.category, item.account, ...(item.tags ?? [])]
      .join(" ").toLocaleLowerCase("zh-CN");
    return terms.every((term) => haystack.includes(term));
  });
  const incomeCents = matched.reduce((sum, item) => sum + (item.type === "收入" ? amountCents(item.amount) : 0), 0);
  const expenseCents = matched.reduce((sum, item) => sum + (item.type === "支出" ? amountCents(item.amount) : 0), 0);
  const elapsedEnd = filters.end < today ? filters.end : today;
  const elapsedDays = filters.start > elapsedEnd ? 0 :
    Math.round((Date.parse(`${elapsedEnd}T00:00:00Z`) - Date.parse(`${filters.start}T00:00:00Z`)) / 86_400_000) + 1;
  const categoryMap = new Map<string, number>();
  const trendMap = new Map<string, number>();
  const monthMap = new Map<string, { incomeCents: number; expenseCents: number; categories: Map<string, number> }>();
  for (const item of matched) {
    const key = item.date.slice(0, 7);
    const month = monthMap.get(key) ?? { incomeCents: 0, expenseCents: 0, categories: new Map<string, number>() };
    const cents = amountCents(item.amount);
    if (item.type === "收入") month.incomeCents += cents;
    if (item.type === "支出") {
      month.expenseCents += cents;
      categoryMap.set(item.category, (categoryMap.get(item.category) ?? 0) + cents);
      month.categories.set(item.category, (month.categories.get(item.category) ?? 0) + cents);
      trendMap.set(trendKey(item.date, filters.trendUnit), (trendMap.get(trendKey(item.date, filters.trendUnit)) ?? 0) + cents);
    }
    monthMap.set(key, month);
  }
  const trend: FinanceAmountGroup[] = [];
  if (elapsedDays) {
    let cursor = trendKey(filters.start, filters.trendUnit);
    const final = trendKey(elapsedEnd, filters.trendUnit);
    while (cursor <= final) {
      trend.push({ key: cursor, amountCents: trendMap.get(cursor) ?? 0 });
      cursor = filters.trendUnit === "month" ? monthStart(cursor, 1) : dateOffset(cursor, filters.trendUnit === "week" ? 7 : 1);
    }
  }
  const categories = [...categoryMap].map(([key, amountCents]) => ({ key, amountCents }))
    .sort((a, b) => b.amountCents - a.amountCents || a.key.localeCompare(b.key, "zh-CN"));
  const monthly: FinanceReport["monthly"] = [];
  for (let key = monthStart(filters.start); key <= filters.end; key = monthStart(key, 1)) {
    if (key > today && !monthMap.has(key.slice(0, 7))) break;
    const value = monthMap.get(key.slice(0, 7));
    monthly.push({ key: key.slice(0, 7), incomeCents: value?.incomeCents ?? 0,
      expenseCents: value?.expenseCents ?? 0,
      categories: [...(value?.categories ?? new Map<string, number>())].map(([category, amountCents]) => ({ key: category, amountCents })) });
  }
  const sorted = [...matched].sort((a, b) => {
    if (filters.sort.startsWith("amount")) return (amountCents(a.amount) - amountCents(b.amount)) *
      (filters.sort.endsWith("desc") ? -1 : 1) || b.date.localeCompare(a.date) || a.id.localeCompare(b.id);
    return a.date.localeCompare(b.date) * (filters.sort.endsWith("desc") ? -1 : 1) || a.id.localeCompare(b.id);
  });
  return { items: sorted.slice((filters.page - 1) * filters.pageSize, filters.page * filters.pageSize),
    totalCount: matched.length, page: filters.page, pageSize: filters.pageSize, incomeCents, expenseCents,
    balanceCents: incomeCents - expenseCents, dailyExpenseCents: elapsedDays ? Math.round(expenseCents / elapsedDays) : null,
    trend, categories, monthly, accounts: [...new Set(transactions.map((item) => item.account).filter(Boolean))].sort(),
    allCount: transactions.length };
}
