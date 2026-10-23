"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { FinanceDialog } from "@/components/finance/finance-dialog";
import { FinanceCategoryManager } from "@/components/finance/finance-category-manager";
import { ActionToast, type ToastNotice } from "@/components/layout/action-toast";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Dialog } from "@/components/shared/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useWorkspaceData } from "@/hooks/use-workspace-data";
import { toBeijingDateKey } from "@/lib/date";
import { dateOffset, formatCents, monthEnd, monthStart, type FinanceReport,
  type FinanceSort, type FinanceTrendUnit } from "@/services/finance-analysis";
import { createFinanceTransaction } from "@/services/finance-service";
import type { FinanceCategorySetting, FinanceTransaction, FinanceTransactionDraft } from "@/types/finance";

type Preset = "month" | "previous" | "three" | "year" | "six" | "twelve" | "custom";
type Filters = { start: string; end: string; type: string; category: string; account: string;
  min: string; max: string; sort: FinanceSort; trendUnit: FinanceTrendUnit; page: number };
const todayKey = () => toBeijingDateKey();
const initial = (): Filters => ({ start: monthStart(todayKey()), end: todayKey(), type: "",
  category: "", account: "", min: "", max: "", sort: "date-desc", trendUnit: "day", page: 1 });
const fallbackColors = ["#2563eb", "#0d9488", "#7c3aed", "#f59e0b", "#e11d48", "#0891b2", "#db2777", "#64748b"];
const money = (cents: number) => "¥" + formatCents(cents);
function presetDates(preset: Preset, today: string): { start: string; end: string } {
  if (preset === "previous") { const start = monthStart(today, -1); return { start, end: monthEnd(start) }; }
  if (preset === "three") return { start: monthStart(today, -2), end: today };
  if (preset === "year") return { start: today.slice(0, 4) + "-01-01", end: today };
  if (preset === "six") return { start: monthStart(today, -5), end: today };
  if (preset === "twelve") return { start: monthStart(today, -11), end: today };
  return { start: monthStart(today), end: today };
}
function rangeLabel(filters: Filters): string { return filters.start + " 至 " + filters.end; }

export function FinanceCenter() {
  const { data, dispatch, domainRevision, reload } = useWorkspaceData();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<Filters>(initial);
  const [preset, setPreset] = useState<Preset>("month");
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [report, setReport] = useState<FinanceReport | null>(null);
  const [categories, setCategories] = useState<FinanceCategorySetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<FinanceTransaction | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<FinanceTransaction | null>(null);
  const [notice, setNotice] = useState<ToastNotice | null>(null);
  const [monthlyView, setMonthlyView] = useState<"compare" | "stack">("compare");
  const requestId = useRef(0);
  const selected = data.financeTransactions.find((item) => item.id === searchParams.get("record")) ?? null;
  const closeSelected = () => router.replace(pathname, { scroll: false });
  const update = (change: Partial<Filters>) => setFilters((previous) => ({ ...previous, ...change, page: change.page ?? 1 }));
  const setRange = (start: string, end: string) => {
    setPreset("custom");
    update({ start: start < filters.start ? filters.start : start, end: end > filters.end ? filters.end : end });
  };
  const selectPreset = (next: Preset) => {
    setPreset(next);
    if (next !== "custom") update(presetDates(next, todayKey()));
  };
  useEffect(() => { const timer = window.setTimeout(() => { setQuery(queryInput.trim());
    setFilters((previous) => previous.page === 1 ? previous : { ...previous, page: 1 }); }, 280);
    return () => window.clearTimeout(timer); }, [queryInput]);
  useEffect(() => {
    const id = ++requestId.current;
    const controller = new AbortController();
    const params = new URLSearchParams({ start: filters.start, end: filters.end, sort: filters.sort,
      trendUnit: filters.trendUnit, page: String(filters.page), pageSize: "20" });
    if (query) params.set("q", query);
    if (filters.type) params.set("type", filters.type);
    if (filters.category) params.set("category", filters.category);
    if (filters.account) params.set("account", filters.account);
    if (filters.min) params.set("min", filters.min);
    if (filters.max) params.set("max", filters.max);
    setLoading(true);
    setError("");
    setReport(null);
    void fetch("/api/private/finance?" + params, { credentials: "same-origin", cache: "no-store", signal: controller.signal })
      .then(async (response) => { const body = await response.json() as FinanceReport & { error?: string };
        if (!response.ok) throw new Error(body.error ?? "账单读取失败。"); return body; })
      .then((body) => { if (id === requestId.current) setReport(body); })
      .catch((cause: unknown) => { if (!controller.signal.aborted && id === requestId.current)
        setError(cause instanceof Error ? cause.message : "账单读取失败。"); })
      .finally(() => { if (id === requestId.current) setLoading(false); });
    return () => controller.abort();
  }, [filters, query, domainRevision]);
  const loadCategories = async () => {
    const response = await fetch("/api/private/finance/categories", { credentials: "same-origin", cache: "no-store" });
    const body = await response.json() as { categories?: FinanceCategorySetting[]; error?: string };
    if (!response.ok) throw new Error(body.error ?? "分类读取失败。");
    setCategories(body.categories ?? []);
  };
  useEffect(() => { void loadCategories().catch((cause: unknown) =>
    setError(cause instanceof Error ? cause.message : "分类读取失败。")); }, []);
  const categoryNames = useMemo(() => [...new Set([...categories.map((item) => item.name),
    ...data.financeTransactions.map((item) => item.category)])].filter(Boolean).sort((a, b) => a.localeCompare(b, "zh-CN")),
    [categories, data.financeTransactions]);
  const categoryColor = (name: string) => categories.find((item) => item.name === name)?.color ??
    fallbackColors[Math.abs([...name].reduce((sum, char) => sum + char.charCodeAt(0), 0)) % fallbackColors.length];
  const save = async (draft: FinanceTransactionDraft, current: FinanceTransaction | null) => {
    const transaction = current ? { ...current, ...draft, updatedAt: new Date().toISOString() } : createFinanceTransaction(draft);
    await dispatch(current ? { type: "finance/updated", transaction } : { type: "finance/added", transaction });
    setNotice({ id: Date.now(), title: "账单已保存", description: "统计与搜索将使用最新记录。" });
  };
  const clear = () => { setFilters(initial()); setPreset("month"); setQueryInput(""); setQuery(""); };
  const pieData = report ? report.categories.slice(0, 7).map((item) => ({ name: item.key,
    value: item.amountCents / 100, color: categoryColor(item.key) })) : [];
  if (report && report.categories.length > 7) pieData.push({ name: "其余分类", value:
    report.categories.slice(7).reduce((sum, item) => sum + item.amountCents, 0) / 100, color: "#cbd5e1" });
  const trendData = report?.trend.map((item) => ({ key: item.key, amount: item.amountCents / 100 })) ?? [];
  const monthData = report?.monthly.map((item) => ({ key: item.key, income: item.incomeCents / 100,
    expense: item.expenseCents / 100, ...Object.fromEntries(item.categories.map((entry) => ["category:" + entry.key, entry.amountCents / 100])) })) ?? [];
  const activeConditions = [rangeLabel(filters), filters.type && "方向：" + filters.type,
    filters.category && "分类：" + filters.category, filters.account && "账户：" + filters.account,
    query && "关键词：" + query, filters.min && "最低 ¥" + filters.min, filters.max && "最高 ¥" + filters.max].filter(Boolean);
  const chartRange = (key: string, unit: FinanceTrendUnit) => {
    if (!key) return;
    const start = unit === "month" ? monthStart(key) : key;
    const end = unit === "day" ? key : unit === "week" ? dateOffset(key, 6) : monthEnd(key);
    setRange(start, end);
  };
  const periodLabel = (key: string, unit: FinanceTrendUnit) => {
    const start = unit === "month" ? monthStart(key) : key;
    const end = unit === "day" ? key : unit === "week" ? dateOffset(key, 6) : monthEnd(key);
    return (start < filters.start ? filters.start : start) + " 至 " + (end > filters.end ? filters.end : end);
  };

  return <div className="space-y-5">
    <PageHeader eyebrow="PERSONAL FINANCE RECORD" title="理财记录"
      description="个人收支流水与统计；期间结余为收入减支出，并非账户余额。"
      actions={<Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus />快速记账</Button>} />
    <section className="space-y-3 rounded-lg border bg-white p-4">
      <div className="flex flex-wrap gap-2"><Select aria-label="统一时间范围" className="w-40" value={preset}
        onChange={(event) => selectPreset(event.target.value as Preset)}>
        <option value="month">本月</option><option value="previous">上月</option><option value="three">近三个月</option>
        <option value="year">本年</option><option value="six">最近六个月</option><option value="twelve">最近十二个月</option>
        <option value="custom">自定义</option></Select>
        <Input aria-label="开始日期" type="date" className="w-40" value={filters.start}
          onChange={(event) => { setPreset("custom"); update({ start: event.target.value }); }} />
        <Input aria-label="结束日期" type="date" className="w-40" value={filters.end}
          onChange={(event) => { setPreset("custom"); update({ end: event.target.value }); }} />
        <Button variant="outline" onClick={clear}>清空全部筛选</Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Input aria-label="搜索账单关键词" placeholder="搜索用途、备注、类别、账户、标签" value={queryInput}
          onChange={(event) => setQueryInput(event.target.value)} />
        <Select aria-label="收支方向筛选" value={filters.type} onChange={(event) => update({ type: event.target.value })}>
          <option value="">全部收支</option><option>收入</option><option>支出</option><option>转账</option></Select>
        <Select aria-label="账单分类筛选" value={filters.category} onChange={(event) => update({ category: event.target.value })}>
          <option value="">全部分类</option>{categoryNames.map((item) => <option key={item}>{item}</option>)}</Select>
        <Select aria-label="账户或支付方式筛选" value={filters.account} onChange={(event) => update({ account: event.target.value })}>
          <option value="">全部账户</option>{report?.accounts.map((item) => <option key={item}>{item}</option>)}</Select>
        <Input aria-label="最低金额（元）" inputMode="decimal" placeholder="最低金额（元）" value={filters.min}
          onChange={(event) => update({ min: event.target.value })} />
        <Input aria-label="最高金额（元）" inputMode="decimal" placeholder="最高金额（元）" value={filters.max}
          onChange={(event) => update({ max: event.target.value })} />
        <Select aria-label="账单排序" value={filters.sort} onChange={(event) => update({ sort: event.target.value as FinanceSort })}>
          <option value="date-desc">日期从新到旧</option><option value="date-asc">日期从旧到新</option>
          <option value="amount-desc">金额从高到低</option><option value="amount-asc">金额从低到高</option></Select>
      </div>
      <div className="flex flex-wrap gap-1 text-xs">{activeConditions.map((item) => <span key={item} className="rounded bg-slate-100 px-2 py-1">{item}</span>)}</div>
    </section>
    {error && <p role="alert" className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {loading && <p role="status" className="text-sm text-slate-500">正在读取账单与统计…</p>}
    {report && <><section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {([["总支出", report.expenseCents, "text-rose-700"], ["总收入", report.incomeCents, "text-emerald-700"],
        ["期间结余", report.balanceCents, "text-slate-900"], ["日均支出", report.dailyExpenseCents, "text-slate-900"]] as const)
        .map(([label, cents, shade]) => <article key={label} className="rounded-lg border bg-white p-4">
          <p className="text-xs text-slate-500">{label}</p><p className={"mt-1 text-2xl font-semibold " + shade}>
            {cents === null ? "—" : money(cents)}</p>{cents === null && <p className="text-xs text-slate-400">范围尚未开始</p>}
        </article>)}
    </section>
    <section className="grid gap-4 xl:grid-cols-2">
      <article className="min-w-0 rounded-lg border bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">消费趋势</h2><Select aria-label="趋势聚合方式" className="w-28" value={filters.trendUnit}
          onChange={(event) => update({ trendUnit: event.target.value as FinanceTrendUnit })}>
          <option value="day">按日</option><option value="week">按周</option><option value="month">按月</option></Select></div>
        {trendData.length ? <div className="mt-4 h-64" onClickCapture={(event) => {
          const points = [...event.currentTarget.querySelectorAll<SVGCircleElement>("[data-trend-key]")];
          const closest = points.map((point) => {
            const bounds = point.getBoundingClientRect();
            return { key: point.dataset.trendKey,
              distance: Math.hypot(event.clientX - (bounds.left + bounds.right) / 2,
                event.clientY - (bounds.top + bounds.bottom) / 2) };
          }).sort((left, right) => left.distance - right.distance)[0];
          if (closest?.key && closest.distance <= 18) chartRange(closest.key, filters.trendUnit);
        }}><ResponsiveContainer width="100%" height="100%"><LineChart data={trendData}>
          <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="key" tick={{ fontSize: 10 }} minTickGap={20} />
          <YAxis tick={{ fontSize: 10 }} /><Tooltip labelFormatter={(value) => periodLabel(String(value), filters.trendUnit)}
            formatter={(value) => money(Math.round(Number(value) * 100))} />
          <Line dataKey="amount" name="支出" stroke="#2563eb" strokeWidth={2}
            dot={({ cx, cy, payload }) => cx === null || cy === null ? null :
              <circle cx={cx} cy={cy} r={3} fill="#2563eb" className="cursor-pointer" pointerEvents="all"
                role="button" tabIndex={0} aria-label={`筛选 ${payload.key} 消费`}
                data-trend-key={String(payload.key)}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault(); chartRange(String(payload.key), filters.trendUnit);
                } }} />}
            activeDot={({ cx, cy, payload }) => <circle cx={cx} cy={cy} r={6} fill="#2563eb"
              className="cursor-pointer" pointerEvents="all" data-trend-key={String(payload.key)} /> } />
        </LineChart></ResponsiveContainer></div> : <EmptyState title="暂无已发生日期" description="未来日期不会显示为零消费。" />}
        <p className="mt-2 text-xs text-slate-500">点击折线点筛选该日、周或月；选择分类可查看其趋势。</p>
      </article>
      <article className="min-w-0 rounded-lg border bg-white p-4"><h2 className="font-semibold">消费类别占比</h2>
        {report.expenseCents ? <div className="grid gap-2 sm:grid-cols-[200px_1fr]">
          <div className="h-52"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData}
            dataKey="value" nameKey="name" innerRadius={48} outerRadius={78}>
            {pieData.map((entry, index) => <Cell key={entry.name + index} fill={entry.color}
              onClick={() => { if (index < 7) update({ category: entry.name }); }} />)}
          </Pie><Tooltip formatter={(value) => money(Math.round(Number(value) * 100))} /></PieChart></ResponsiveContainer></div>
          <div className="max-h-56 space-y-1 overflow-y-auto">{report.categories.map((item) =>
            <button key={item.key} type="button" onClick={() => update({ category: item.key })}
              className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs hover:bg-slate-50">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: categoryColor(item.key) }} />
              <span className="min-w-0 flex-1 truncate">{item.key}</span><span>{money(item.amountCents)}</span>
              <span className="w-10 text-right text-slate-500">{(item.amountCents / report.expenseCents * 100).toFixed(1)}%</span>
            </button>)}</div></div> : <EmptyState title="此范围没有支出" description="调整筛选范围或记一笔支出。" />}
      </article>
    </section>
    <section className="min-w-0 rounded-lg border bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="font-semibold">月度收支与分类构成</h2><div className="flex flex-wrap gap-2">
        <Button size="sm" variant={monthlyView === "compare" ? "default" : "outline"} onClick={() => setMonthlyView("compare")}>收支对比</Button>
        <Button size="sm" variant={monthlyView === "stack" ? "default" : "outline"} onClick={() => setMonthlyView("stack")}>分类堆叠</Button>
        <Button size="sm" variant="outline" onClick={() => selectPreset("six")}>近六个月</Button>
        <Button size="sm" variant="outline" onClick={() => selectPreset("twelve")}>近十二个月</Button>
      </div></div>
      {monthData.length ? <div className="mt-4 h-64" onClickCapture={(event) => {
        const ticks = [...event.currentTarget.querySelectorAll<SVGTextElement>("svg text")]
          .filter((tick) => /^\d{4}-\d{2}$/.test(tick.textContent ?? ""));
        const closest = ticks.map((tick) => {
          const bounds = tick.getBoundingClientRect();
          return { key: tick.textContent ?? "", distance: Math.abs(event.clientX - (bounds.left + bounds.right) / 2) };
        }).sort((left, right) => left.distance - right.distance)[0];
        if (closest?.key && closest.distance <= 42) chartRange(closest.key, "month");
      }}><ResponsiveContainer width="100%" height="100%"><BarChart data={monthData}>
        <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="key" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} /><Tooltip labelFormatter={(value) => periodLabel(String(value), "month")}
          formatter={(value) => money(Math.round(Number(value) * 100))} />
        <Legend />{monthlyView === "compare" ? <><Bar dataKey="income" name="收入" fill="#16a34a" />
          <Bar dataKey="expense" name="支出" fill="#e11d48" /></> :
          report.categories.map((item) => <Bar key={item.key} dataKey={"category:" + item.key} name={item.key}
            stackId="expense" fill={categoryColor(item.key)} />)}
      </BarChart></ResponsiveContainer></div> : <EmptyState title="此范围没有月份" description="未来月份不填零。" />}
      <p className="mt-2 text-xs text-slate-500">{filters.end <= todayKey() ? "当前月截至今日。" : "当前范围包含未来日期的已录入账单。"}点击柱状图月份后，卡片和账单同步切换至该月。</p>
    </section>
    <section className="rounded-lg border bg-white"><header className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
      <div><h2 className="font-semibold">账单搜索与明细</h2><p className="mt-1 text-xs text-slate-500">
        匹配 {report.totalCount} 笔 · 收入 {money(report.incomeCents)} · 支出 {money(report.expenseCents)} · 期间结余 {money(report.balanceCents)}
      </p></div></header>
      {report.items.length ? <div className="divide-y">{report.items.map((item) => <article key={item.id}
        className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
        <div className="min-w-0"><p className="text-xs text-slate-500">{item.date} · {item.category} · {item.type}</p>
          <p className="mt-1 truncate text-sm font-medium" title={item.description}>{item.description || "未填写用途"}</p>
          {item.note && <p className="mt-1 line-clamp-2 text-xs text-slate-500" title={item.note}>{item.note}</p>}
          {item.account && <p className="mt-1 text-xs text-slate-400">{item.account}</p>}</div>
        <div className="flex shrink-0 items-center gap-1"><b className={item.type === "收入" ? "mr-2 text-emerald-700" : "mr-2 text-rose-700"}>
          {item.type === "收入" ? "+" : item.type === "支出" ? "-" : ""}{money(Math.round(item.amount * 100))}</b>
          <Button size="sm" variant="outline" onClick={() => router.push(pathname + "?record=" + encodeURIComponent(item.id), { scroll: false })}>查看</Button>
          <Button size="sm" variant="ghost" aria-label={"编辑" + item.description} onClick={() => { setEditing(item); setFormOpen(true); }}><Edit3 /></Button>
          <Button size="sm" variant="destructive" aria-label={"删除" + item.description} onClick={() => setDeleting(item)}><Trash2 /></Button>
        </div></article>)}</div> : <EmptyState title={report.allCount ? "没有匹配结果" : "尚无账单"}
          description={report.allCount ? "调整或清空筛选条件。" : "点击快速记账录入第一笔真实收支。"} />}
      {report.totalCount > 20 && <div className="flex items-center justify-end gap-2 border-t p-3">
        <Button size="sm" variant="outline" disabled={filters.page <= 1} onClick={() => update({ page: filters.page - 1 })}>上一页</Button>
        <span className="text-xs">第 {filters.page} / {Math.ceil(report.totalCount / 20)} 页</span>
        <Button size="sm" variant="outline" disabled={filters.page >= Math.ceil(report.totalCount / 20)}
          onClick={() => update({ page: filters.page + 1 })}>下一页</Button></div>}
    </section></>}
    <FinanceCategoryManager categories={categories} onChanged={async () => { await loadCategories(); await reload(); }} />
    <FinanceDialog open={formOpen} transaction={editing} categories={categories} onClose={() => setFormOpen(false)} onSubmit={save} />
    <Dialog open={Boolean(selected)} title={selected?.description || "账单详情"} onClose={closeSelected}
      footer={<><Button variant="outline" onClick={closeSelected}>关闭</Button>{selected && <Button onClick={() => {
        setEditing(selected); setFormOpen(true); closeSelected(); }}>编辑账单</Button>}</>}>
      {selected && <div className="space-y-2 break-words text-sm"><p>{selected.date} · {selected.category} · {selected.type}</p>
        <p className="text-lg font-semibold">{selected.type === "收入" ? "+" : selected.type === "支出" ? "-" : ""}{money(Math.round(selected.amount * 100))}</p>
        {selected.account && <p>账户：{selected.account}</p>}{selected.note && <p className="whitespace-pre-wrap">备注：{selected.note}</p>}
        {selected.tags.length > 0 && <p>标签：{selected.tags.join("、")}</p>}</div>}
    </Dialog>
    <ConfirmDialog open={Boolean(deleting)} title="删除账单" description="删除后统计与搜索会立即更新。"
      onCancel={() => setDeleting(null)} onConfirm={() => { if (!deleting) return;
        void dispatch({ type: "finance/deleted", transactionId: deleting.id }).then(() => {
          setDeleting(null); if (selected?.id === deleting.id) closeSelected();
        }).catch((cause: unknown) => setNotice({ id: Date.now(), title: "删除失败",
          description: cause instanceof Error ? cause.message : "服务器写入失败。" })); }} />
    <ActionToast notice={notice} onDismiss={() => setNotice(null)} />
  </div>;
}
