/** API date-only fields are always YYYY-MM-DD; timestamps use UTC ISO 8601. */
export function parseDateOnly(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("日期必须为 YYYY-MM-DD。");
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.toISOString().slice(0, 10) !== value) throw new Error("日期无效。");
  return date;
}

export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function canonicalReviewDate(type: "DAILY" | "WEEKLY" | "MONTHLY" | "PROJECT", value: string): Date {
  const date = parseDateOnly(value);
  if (type === "WEEKLY") date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  if (type === "MONTHLY") date.setUTCDate(1);
  return date;
}

/** Future money fields cross the API as decimal strings, never JSON floating point numbers. */
export type DecimalString = string;
