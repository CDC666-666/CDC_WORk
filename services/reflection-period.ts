import { toLocalDateKey } from "@/lib/date";
import type { Review, ReviewType } from "@/types/review";

export interface ReflectionFilter {
  type?: ReviewType;
  relatedProjectId?: string;
  dateFrom?: string;
  dateTo?: string;
}

function localDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("请选择有效的本地日期。");
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (toLocalDateKey(date) !== value) throw new Error("请选择有效的本地日期。");
  return date;
}

/** Date-only values stay in local calendar time; no UTC conversion is involved. */
export function reflectionPeriod(type: ReviewType, value: string): { start: string; end: string } {
  const date = localDate(value);
  if (type === "WEEKLY") {
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    const start = toLocalDateKey(date);
    date.setDate(date.getDate() + 6);
    return { start, end: toLocalDateKey(date) };
  }
  if (type === "MONTHLY") {
    date.setDate(1);
    const start = toLocalDateKey(date);
    date.setMonth(date.getMonth() + 1, 0);
    return { start, end: toLocalDateKey(date) };
  }
  return { start: value, end: value };
}

export function canonicalReflectionDate(type: ReviewType, value: string): string {
  return reflectionPeriod(type, value).start;
}

export const reflectionTypeLabels: Record<ReviewType, string> = {
  DAILY: "每日总结", WEEKLY: "每周总结", MONTHLY: "每月总结", PROJECT: "项目复盘",
};

export function reflectionPeriodLabel(type: ReviewType, value: string): string {
  try {
    const { start, end } = reflectionPeriod(type, value);
    return start === end ? start : `${start} 至 ${end}`;
  } catch {
    return `${value}（日期无效）`;
  }
}

export function filterReflections(items: Review[], filter: ReflectionFilter): Review[] {
  return items.filter((item) => {
    let recordDate = item.date;
    try { recordDate = canonicalReflectionDate(item.type, item.date); } catch { /* Keep legacy records visible. */ }
    return (!filter.type || item.type === filter.type) &&
      (!filter.relatedProjectId || item.relatedProjectId === filter.relatedProjectId) &&
      (!filter.dateFrom || recordDate >= filter.dateFrom) &&
      (!filter.dateTo || recordDate <= filter.dateTo);
  });
}
