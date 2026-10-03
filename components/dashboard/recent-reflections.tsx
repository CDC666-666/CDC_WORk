"use client";

import Link from "next/link";
import { useReflections } from "@/hooks/use-reflections";
import { reflectionPeriodLabel, reflectionTypeLabels } from "@/services/reflection-period";

export function RecentReflections() {
  const { reviews, isLoading, error } = useReflections();
  const recent = [...reviews].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0, 3);
  return <section className="rounded-lg border border-border bg-white p-5 shadow-sm" aria-label="最近总结">
    <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold">最近总结</h2><Link href="/reflections" className="text-xs text-blue-700 hover:underline">查看全部</Link></div>
    {isLoading ? <p className="mt-4 text-xs text-slate-500">正在加载总结…</p> : error ? <p className="mt-4 text-xs text-rose-700">总结读取失败：{error}</p>
      : recent.length ? <div className="mt-3 divide-y">{recent.map((item) => <Link key={item.id} href={`/reflections?reviewId=${encodeURIComponent(item.id)}`} className="block min-w-0 py-2 hover:text-blue-700"><p className="truncate text-sm font-medium">{item.summary}</p><p className="mt-1 text-xs text-slate-500">{reflectionTypeLabels[item.type]} · {reflectionPeriodLabel(item.type, item.date)}</p></Link>)}</div>
        : <p className="mt-4 text-xs text-slate-500">还没有总结。<Link href="/reflections" className="text-blue-700 hover:underline">开始记录</Link></p>}
  </section>;
}
