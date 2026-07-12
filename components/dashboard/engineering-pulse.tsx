import Link from "next/link";
import { BookOpenCheck, Bug, Library } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { WorkspaceData } from "@/types/workspace";

export function EngineeringPulse({ data }: { data: WorkspaceData }) {
  const openIssues = data.technicalIssues.filter((item) => item.status !== "已解决" && item.status !== "不处理").slice(0, 3);
  const logs = [...data.workLogs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const knowledge = [...data.knowledgeItems].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3);
  const groups = [
    { title: "最近工程日志", href: "/logs", icon: BookOpenCheck, items: logs.map((item) => ({ id: item.id, title: item.title, meta: `${item.date} · ${item.resultStatus}` })) },
    { title: "待闭环问题", href: "/reviews", icon: Bug, items: openIssues.map((item) => ({ id: item.id, title: item.title, meta: `${item.severity} · ${item.status}` })) },
    { title: "最近知识", href: "/knowledge", icon: Library, items: knowledge.map((item) => ({ id: item.id, title: item.title, meta: `${item.itemType} · ${item.status}` })) },
  ];
  return <Card className="h-full rounded-lg bg-white shadow-sm"><CardHeader className="border-b p-5"><div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold">工程与知识闭环</h2><p className="mt-1 text-[11px] text-slate-500">统一 Workspace 的最新研发状态</p></div><span className="rounded bg-emerald-50 px-2 py-1 text-[10px] text-emerald-700">{openIssues.length} 个待处理问题</span></div></CardHeader><CardContent className="grid gap-4 p-5 md:grid-cols-3 xl:grid-cols-1">{groups.map((group) => { const Icon = group.icon; return <section key={group.title}><div className="flex items-center justify-between"><h3 className="flex items-center gap-2 text-xs font-semibold"><Icon className="h-4 w-4 text-blue-600" />{group.title}</h3><Button asChild size="sm" variant="ghost"><Link href={group.href}>查看</Link></Button></div><div className="mt-2 space-y-2">{group.items.length ? group.items.map((item) => <div key={item.id} className="rounded bg-slate-50 px-3 py-2"><p className="truncate text-xs font-medium">{item.title}</p><p className="mt-1 text-[10px] text-slate-500">{item.meta}</p></div>) : <p className="py-3 text-xs text-slate-400">暂无数据</p>}</div></section>; })}</CardContent></Card>;
}
