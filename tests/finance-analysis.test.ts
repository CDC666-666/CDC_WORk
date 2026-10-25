import assert from "node:assert/strict";
import test from "node:test";
import { analyzeFinance, validDateKey, type FinanceFilters } from "@/services/finance-analysis";
import { isFinanceTransaction } from "@/lib/storage/workspace-validation";
import type { FinanceTransaction } from "@/types/finance";

const filters: FinanceFilters = { start: "2026-10-01", end: "2026-10-31", query: "", type: "", category: "",
  account: "", sort: "date-desc", trendUnit: "day", page: 1, pageSize: 2 };
function bill(id: string, date: string, type: "收入" | "支出", amount: number, category = "餐饮", note = ""): FinanceTransaction {
  return { id, date, type, amount, category, account: "微信", description: "食堂午餐", note, tags: [],
    createdAt: "2026-10-21T00:00:00Z", updatedAt: "2026-10-21T00:00:00Z" };
}
const bills = [bill("a", "2026-10-01", "支出", 0.1), bill("b", "2026-10-03", "支出", 0.2),
  bill("c", "2026-10-05", "收入", 100, "兼职"), bill("d", "2026-09-30", "支出", 3),
  bill("e", "2026-10-25", "支出", 5, "交通", "月底补写")];

test("账单汇总使用整数分、全部匹配行及截至今日的自然日", () => {
  const result = analyzeFinance(bills, filters, "2026-10-21");
  assert.equal(result.totalCount, 4);
  assert.equal(result.items.length, 2);
  assert.equal(result.incomeCents, 10000);
  assert.equal(result.expenseCents, 530);
  assert.equal(result.balanceCents, 9470);
  assert.equal(result.dailyExpenseCents, 25);
  assert.equal(result.trend.find((item) => item.key === "2026-10-02")?.amountCents, 0);
  assert.equal(result.trend.some((item) => item.key === "2026-10-22"), false);
  assert.deepEqual(result.categories.map((item) => [item.key, item.amountCents]), [["交通", 500], ["餐饮", 30]]);
});

test("关键词、方向、类别、金额、分页与图表遵守同一筛选", () => {
  const result = analyzeFinance(bills, { ...filters, query: "月底补写", type: "支出", category: "交通",
    minCents: 500, maxCents: 500, page: 1 }, "2026-10-21");
  assert.equal(result.totalCount, 1);
  assert.equal(result.items[0].id, "e");
  assert.equal(result.expenseCents, 500);
  assert.equal(result.monthly[0].expenseCents, 500);
  assert.equal(analyzeFinance(bills, { ...filters, page: 2 }, "2026-10-21").items.length, 2);
});

test("未来范围日均为空且转账不重复计入收支", () => {
  const transfer: FinanceTransaction = { ...bill("transfer", "2026-11-01", "支出", 50), type: "转账" };
  const result = analyzeFinance([transfer], { ...filters, start: "2026-11-01", end: "2026-11-30" }, "2026-10-21");
  assert.equal(result.dailyExpenseCents, null);
  assert.equal(result.incomeCents, 0);
  assert.equal(result.expenseCents, 0);
  assert.deepEqual(result.trend, []);
});

test("自定义分类与备注可通过旧工作区导入校验，非法纯日期被拒绝", () => {
  assert.equal(isFinanceTransaction(bill("custom", "2026-10-10", "支出", 1.23, "电子元器件", "传感器")), true);
  assert.equal(validDateKey("2026-02-29"), false);
  assert.equal(validDateKey("2024-02-29"), true);
});

test("双层构成以类别和主要标签分组，每笔支出恰好进入一个外圈扇区", () => {
  const tagged = [
    { ...bill("meal", "2026-10-02", "支出", 150), tags: ["正餐", "聚会"], primaryTag: "正餐" },
    { ...bill("drink", "2026-10-03", "支出", 50), tags: ["饮料"] },
    { ...bill("other-food", "2026-10-04", "支出", 20), tags: ["其他"] },
    { ...bill("other-life", "2026-10-05", "支出", 30, "生活"), tags: ["其他"] },
    { ...bill("untagged", "2026-10-06", "支出", 10, "生活"), tags: [] },
    { ...bill("multiple", "2026-10-07", "支出", 40, "生活"), tags: ["日用品", "临时"] },
    { ...bill("transfer", "2026-10-08", "支出", 999), type: "转账" as const, tags: ["正餐"] },
  ];
  const result = analyzeFinance(tagged, filters, "2026-10-21");
  assert.equal(result.composition.expenseCents, 30000);
  assert.equal(result.composition.categories.reduce((sum, category) => sum + category.amountCents, 0), 30000);
  for (const category of result.composition.categories) {
    assert.equal(category.tags.reduce((sum, tag) => sum + tag.amountCents, 0), category.amountCents);
  }
  assert.equal(result.composition.categories.find((category) => category.key === "餐饮")?.tags
    .find((tag) => tag.key === "其他")?.amountCents, 2000);
  assert.equal(result.composition.categories.find((category) => category.key === "生活")?.tags
    .find((tag) => tag.key === "其他")?.amountCents, 3000);
  assert.equal(result.composition.categories.find((category) => category.key === "生活")?.tags
    .find((tag) => tag.kind === "unset")?.amountCents, 1000);
  assert.equal(result.composition.categories.find((category) => category.key === "生活")?.tags
    .find((tag) => tag.kind === "unassigned")?.amountCents, 4000);
  assert.equal((15000 / 22000 * 100).toFixed(1), "68.2");
  assert.equal((15000 / result.composition.expenseCents * 100).toFixed(1), "50.0");
  const selected = analyzeFinance(tagged, { ...filters, category: "餐饮", tagMode: "named", tag: "正餐" }, "2026-10-21");
  assert.equal(selected.totalCount, 1);
  assert.equal(selected.expenseCents, 15000);
  assert.equal(selected.composition.expenseCents, 30000);
  assert.equal(selected.composition.categories.length, 2);
  assert.equal(analyzeFinance(tagged, { ...filters, category: "生活", tagMode: "unassigned" }, "2026-10-21")
    .items[0]?.id, "multiple");
  assert.equal(analyzeFinance(tagged, { ...filters, category: "生活", tagMode: "unset" }, "2026-10-21")
    .items[0]?.id, "untagged");
});
