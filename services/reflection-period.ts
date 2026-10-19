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
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.toISOString().slice(0, 10) !== value) throw new Error("请选择有效的本地日期。");
  return date;
}

/** Calendar arithmetic uses UTC methods on date-only values, independent of the host timezone. */
export function reflectionPeriod(type: ReviewType, value: string): { start: string; end: string } {
  const date = localDate(value);
  if (type === "WEEKLY") {
    date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
    const start = date.toISOString().slice(0, 10);
    date.setUTCDate(date.getUTCDate() + 6);
    return { start, end: date.toISOString().slice(0, 10) };
  }
  if (type === "MONTHLY") {
    date.setUTCDate(1);
    const start = date.toISOString().slice(0, 10);
    date.setUTCMonth(date.getUTCMonth() + 1, 0);
    return { start, end: date.toISOString().slice(0, 10) };
  }
  return { start: value, end: value };
}

/** Legacy columns are composed only for display/editing; no record is rewritten on read. */
export function reflectionBody(item: Pick<Review, "achievement" | "problem" | "plan">): string {
  return [item.achievement, item.problem && `问题\n${item.problem}`, item.plan && `计划\n${item.plan}`]
    .filter(Boolean).join("\n\n");
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
