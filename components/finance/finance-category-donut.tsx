"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCents, type FinanceReport, type FinanceTagMode } from "@/services/finance-analysis";

type Composition = FinanceReport["composition"];
type Focus = { category: string; kind?: FinanceTagMode; tag?: string };

function shade(color: string, index: number): string {
  if (!/^#[\da-f]{6}$/i.test(color)) return color;
  const weight = [0.18, 0.36, -0.16, 0.5, -0.3][index % 5];
  const channel = (offset: number) => {
    const value = Number.parseInt(color.slice(offset, offset + 2), 16);
    return Math.round(weight >= 0 ? value + (255 - value) * weight : value * (1 + weight))
      .toString(16).padStart(2, "0");
  };
  return `#${channel(1)}${channel(3)}${channel(5)}`;
}

const percent = (part: number, total: number) => total > 0 ? `${(part / total * 100).toFixed(1)}%` : "0.0%";
const money = (cents: number) => `¥${formatCents(cents)}`;

export function FinanceCategoryDonut({ composition, categoryColor, selection, onCategory, onTag, onClear }: {
  composition: Composition;
  categoryColor: (category: string) => string;
  selection: Focus | null;
  onCategory: (category: string) => void;
  onTag: (category: string, kind: FinanceTagMode, tag: string) => void;
  onClear: () => void;
}) {
  const [expanded, setExpanded] = useState<string[]>([]);
  const [hover, setHover] = useState<Focus | null>(null);
  const categories = composition.categories;
  const outer = categories.flatMap((category) => category.tags.map((tag, index) => ({
    category: category.key, ...tag, color: shade(categoryColor(category.key), index),
  })));
  const focus = hover ?? selection;
  const focusedCategory = categories.find((item) => item.key === focus?.category);
  const focusedTag = focus?.kind ? focusedCategory?.tags.find((item) =>
    item.kind === focus.kind && (item.kind !== "named" || item.key === focus.tag)) : undefined;
  const toggle = (category: string) => setExpanded((previous) => previous.includes(category) ?
    previous.filter((item) => item !== category) : [...previous, category]);

  return <article className="min-w-0 rounded-lg border bg-white p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="font-semibold">消费类别与标签占比</h2>
      {selection && <button type="button" onClick={onClear} className="text-xs text-blue-700 hover:underline">返回全部类别与标签</button>}
    </div>
    <p className="mt-1 text-xs text-slate-500">内圈为类别，外圈为所属标签；构成按当前日期等基础条件计算，选择扇区后保留完整构成。</p>
    {selection && <p className="mt-2 rounded bg-blue-50 px-2 py-1 text-xs text-blue-800">当前账单筛选：{selection.category}{selection.kind ? ` / ${selection.tag}` : ""}</p>}
    {composition.expenseCents > 0 ? <div className="mt-2 grid min-w-0 gap-3 md:grid-cols-[minmax(240px,1fr)_minmax(220px,0.95fr)] md:items-start">
      <div className="min-w-0">
        <div className="h-[280px] w-full sm:h-[320px]">
          <ResponsiveContainer width="100%" height="100%"><PieChart>
            <Pie data={categories} dataKey="amountCents" nameKey="key" cx="50%" cy="50%"
              innerRadius="27%" outerRadius="52%" stroke="#fff" strokeWidth={1} isAnimationActive={false}
              onMouseEnter={(_, index) => setHover({ category: categories[index].key })}
              onMouseLeave={() => setHover(null)}
              onClick={(_, index) => onCategory(categories[index].key)}>
              {categories.map((item) => <Cell key={item.key} fill={categoryColor(item.key)}
                className="cursor-pointer" />)}
            </Pie>
            <Pie data={outer} dataKey="amountCents" nameKey="key" cx="50%" cy="50%"
              innerRadius="55%" outerRadius="82%" stroke="#fff" strokeWidth={1} isAnimationActive={false}
              onMouseEnter={(_, index) => setHover({ category: outer[index].category,
                kind: outer[index].kind, tag: outer[index].key })}
              onMouseLeave={() => setHover(null)}
              onClick={(_, index) => onTag(outer[index].category, outer[index].kind, outer[index].key)}>
              {outer.map((item) => <Cell key={`${item.category}:${item.kind}:${item.key}`} fill={item.color}
                className="cursor-pointer" />)}
            </Pie>
          </PieChart></ResponsiveContainer>
        </div>
        <div role="status" aria-live="polite" className="min-h-20 rounded bg-slate-50 px-3 py-2 text-xs text-slate-600">
          {focusedCategory ? <><b className="text-slate-900">{focusedCategory.key}{focusedTag ? ` / ${focusedTag.key}` : ""}</b>
            <p className="mt-1">支出：{money(focusedTag?.amountCents ?? focusedCategory.amountCents)}</p>
            {focusedTag && <p>占{focusedCategory.key}：{percent(focusedTag.amountCents, focusedCategory.amountCents)}</p>}
            <p>占总支出：{percent(focusedTag?.amountCents ?? focusedCategory.amountCents, composition.expenseCents)}</p></> :
            <p>悬停或点击扇区查看金额与占比；点击扇区筛选账单。</p>}
        </div>
      </div>
      <div className="max-h-[410px] min-w-0 space-y-1 overflow-y-auto" aria-label="类别与标签明细">
        {categories.map((category) => <div key={category.key} className="rounded border border-slate-100">
          <div className="flex min-w-0 items-center gap-1 px-1 py-1">
            <button type="button" aria-label={`${expanded.includes(category.key) ? "收起" : "展开"}${category.key}标签`}
              aria-expanded={expanded.includes(category.key)} onClick={() => toggle(category.key)}
              className="grid h-7 w-7 shrink-0 place-items-center rounded hover:bg-slate-100">
              {expanded.includes(category.key) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            <button type="button" onClick={() => onCategory(category.key)}
              className="flex min-w-0 flex-1 items-center gap-2 rounded px-1 py-1 text-left text-xs hover:bg-slate-50"
              aria-label={`筛选类别 ${category.key}`}>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: categoryColor(category.key) }} />
              <span className="min-w-0 flex-1 truncate">{category.key}</span>
              <span className="shrink-0 tabular-nums">{money(category.amountCents)}</span>
              <span className="w-12 shrink-0 text-right tabular-nums text-slate-500" title="占总支出">{percent(category.amountCents, composition.expenseCents)}</span>
            </button>
          </div>
          {expanded.includes(category.key) && <div className="space-y-0.5 border-t border-slate-100 py-1 pl-9 pr-2">
            {category.tags.map((tag, index) => <button key={`${tag.kind}:${tag.key}`} type="button"
              onClick={() => onTag(category.key, tag.kind, tag.key)} aria-label={`筛选标签 ${category.key} / ${tag.key}`}
              className="flex w-full min-w-0 items-center gap-2 rounded px-1 py-1 text-left text-xs hover:bg-slate-50">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: shade(categoryColor(category.key), index) }} />
              <span className="min-w-0 flex-1 truncate">{tag.key}</span>
              <span className="shrink-0 tabular-nums">{money(tag.amountCents)}</span>
              <span className="w-24 shrink-0 text-right tabular-nums text-slate-500">占本类别 {percent(tag.amountCents, category.amountCents)}</span>
            </button>)}
          </div>}
        </div>)}
      </div>
    </div> : <EmptyState title="此范围没有支出" description="调整筛选范围或记一笔支出。" />}
  </article>;
}
