"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Edit3, Grid2X2, List, Plus, Trash2 } from "lucide-react";

import { ActionToast, type ToastNotice } from "@/components/layout/action-toast";
import { ReadingItemDialog } from "@/components/reading/reading-item-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { useWorkspaceData } from "@/hooks/use-workspace-data";
import { formatChineseDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { ReadingCategory, ReadingItem, ReadingItemDraft, ReadingStatus } from "@/types/reading";

type ReadingSort = "deadline" | "progress" | "updated";
type ViewMode = "shelf" | "list";

export function ReadingCenter() {
  const workspace = useWorkspaceData();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ReadingStatus | "全部">("全部");
  const [category, setCategory] = useState<ReadingCategory | "全部">("全部");
  const [sort, setSort] = useState<ReadingSort>("deadline");
  const [view, setView] = useState<ViewMode>("shelf");
  const [editing, setEditing] = useState<ReadingItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<ReadingItem | null>(null);
  const [notice, setNotice] = useState<ToastNotice | null>(null);
  const show = (title: string, description: string) => setNotice({ id: Date.now(), title, description });
  const items = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = workspace.data.readingItems.filter((item) => (!normalized || `${item.title} ${item.author}`.toLowerCase().includes(normalized)) && (status === "全部" || item.status === status) && (category === "全部" || item.category === category));
    return [...filtered].sort((a, b) => {
      if (sort === "progress") return (b.currentPage / b.totalPages) - (a.currentPage / a.totalPages);
      if (sort === "updated") return b.updatedAt.localeCompare(a.updatedAt);
      return a.targetDate.localeCompare(b.targetDate);
    });
  }, [category, query, sort, status, workspace.data.readingItems]);
  const suggestedPages = workspace.data.readingItems.filter((item) => item.status === "阅读中").reduce((sum, item) => sum + Math.min(item.dailyPageTarget, item.totalPages - item.currentPage), 0);

  const changePages = (item: ReadingItem, amount: number) => {
    const currentPage = Math.min(item.totalPages, Math.max(0, item.currentPage + amount));
    workspace.updateReadingItem({ ...item, currentPage, status: item.status === "待读" && currentPage > 0 ? "阅读中" : item.status });
    if (currentPage === item.totalPages && item.status !== "已完成") show("已读到最后一页", "建议将这本书标记为“已完成”。"); else show("阅读进度已更新", `${item.title}：${currentPage}/${item.totalPages} 页`);
  };
  const markCompleted = (item: ReadingItem) => { workspace.updateReadingItem({ ...item, currentPage: item.totalPages, status: "已完成", completedAt: new Date().toISOString() }); show("阅读已完成", item.title); };

  return <div className="space-y-5 lg:space-y-6">
    <PageHeader eyebrow="READING PLAN" title="阅读计划" description="管理书目、每日阅读目标、页数进度和个人笔记。" actions={<Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus />新增书籍</Button>} />
    <section className="grid gap-3 sm:grid-cols-3"><article className="rounded-lg border border-border bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">书架总数</p><p className="mt-1 text-2xl font-semibold">{workspace.data.readingItems.length}</p></article><article className="rounded-lg border border-border bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">正在阅读</p><p className="mt-1 text-2xl font-semibold">{workspace.data.readingItems.filter((item) => item.status === "阅读中").length}</p></article><article className="rounded-lg border border-border bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">今日建议阅读</p><p className="mt-1 text-2xl font-semibold">{suggestedPages} 页</p></article></section>
    <section className="rounded-lg border border-border bg-white p-4 shadow-sm"><div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_160px_160px_160px_auto]"><Input aria-label="搜索书名和作者" placeholder="搜索书名或作者" value={query} onChange={(event) => setQuery(event.target.value)} /><Select aria-label="按阅读状态筛选" value={status} onChange={(event) => setStatus(event.target.value as ReadingStatus | "全部")}><option>全部</option>{(["待读", "阅读中", "已完成", "已暂停"] as ReadingStatus[]).map((value) => <option key={value}>{value}</option>)}</Select><Select aria-label="按阅读类别筛选" value={category} onChange={(event) => setCategory(event.target.value as ReadingCategory | "全部")}><option>全部</option>{(["专业技术", "课程教材", "产品管理", "创业商业", "文学通识", "其他"] as ReadingCategory[]).map((value) => <option key={value}>{value}</option>)}</Select><Select aria-label="阅读排序" value={sort} onChange={(event) => setSort(event.target.value as ReadingSort)}><option value="deadline">截止时间</option><option value="progress">阅读进度</option><option value="updated">最近更新</option></Select><div className="flex rounded-md border border-slate-200 p-1"><button type="button" aria-label="书架卡片视图" onClick={() => setView("shelf")} className={cn("grid h-8 w-8 place-items-center rounded", view === "shelf" && "bg-blue-50 text-blue-700")}><Grid2X2 className="h-4 w-4" /></button><button type="button" aria-label="紧凑列表视图" onClick={() => setView("list")} className={cn("grid h-8 w-8 place-items-center rounded", view === "list" && "bg-blue-50 text-blue-700")}><List className="h-4 w-4" /></button></div></div></section>
    {items.length ? <section className={cn("grid gap-4", view === "shelf" ? "md:grid-cols-2 2xl:grid-cols-3" : "grid-cols-1")}>{items.map((item, index) => { const progress = Math.round((item.currentPage / item.totalPages) * 100); const colors = ["bg-blue-700", "bg-emerald-700", "bg-violet-700", "bg-rose-700", "bg-slate-700"]; return <article key={item.id} className={cn("overflow-hidden rounded-lg border border-border bg-white shadow-sm", view === "list" && "sm:flex")}><div className={cn("flex min-h-36 flex-col justify-between p-4 text-white", colors[index % colors.length], view === "list" && "sm:w-44 sm:shrink-0")}><span className="text-[10px] font-semibold">{item.category}</span><div><p className="line-clamp-3 text-base font-semibold leading-6">{item.title}</p><p className="mt-2 text-xs text-white/75">{item.author}</p></div></div><div className="flex min-w-0 flex-1 flex-col p-4"><div className="flex justify-between gap-3 text-[11px]"><span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600">{item.status}</span><span className="text-slate-400">目标 {formatChineseDate(item.targetDate)}</span></div><div className="mt-4 flex items-end justify-between"><div><p className="text-2xl font-semibold text-slate-950">{progress}%</p><p className="mt-1 text-[11px] text-slate-500">{item.currentPage} / {item.totalPages} 页</p></div><p className="text-xs text-blue-700">今日 {Math.min(item.dailyPageTarget, Math.max(0, item.totalPages - item.currentPage))} 页</p></div><Progress value={progress} className="mt-3 h-2 bg-slate-100" />{item.notes && <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">笔记：{item.notes}</p>}<div className="mt-auto flex flex-wrap gap-1.5 border-t border-border pt-4"><Button size="sm" variant="outline" onClick={() => changePages(item, 5)}>+5 页</Button><Button size="sm" variant="outline" onClick={() => changePages(item, 10)}>+10 页</Button><Button size="sm" variant="outline" onClick={() => changePages(item, 20)}>+20 页</Button>{item.currentPage >= item.totalPages && item.status !== "已完成" && <Button size="sm" onClick={() => markCompleted(item)}><CheckCircle2 />标为完成</Button>}<Button size="sm" variant="ghost" onClick={() => { setEditing(item); setFormOpen(true); }}><Edit3 />编辑</Button><Button size="sm" variant="destructive" onClick={() => setDeleting(item)}><Trash2 />删除</Button></div></div></article>; })}</section> : <EmptyState title={workspace.data.readingItems.length ? "没有符合条件的书籍" : "书架还是空的"} description="调整筛选条件，或添加第一本计划阅读的书。" actionLabel="新增书籍" onAction={() => { setEditing(null); setFormOpen(true); }} />}
    <ReadingItemDialog open={formOpen} item={editing} onClose={() => setFormOpen(false)} onCreate={(draft: ReadingItemDraft) => { workspace.addReadingItem(draft); show("书籍已加入", "书架和首页阅读数据已同步。 "); }} onUpdate={(item) => { workspace.updateReadingItem(item); show("书籍已更新", "阅读进度和笔记已保存。 "); }} />
    <ConfirmDialog open={Boolean(deleting)} title="删除书籍" description={`确定从阅读计划中删除“${deleting?.title ?? "该书籍"}”吗？`} onCancel={() => setDeleting(null)} onConfirm={() => { if (deleting) workspace.deleteReadingItem(deleting.id); setDeleting(null); show("书籍已删除", "该阅读条目已从本地数据移除。 "); }} />
    <ActionToast notice={notice} onDismiss={() => setNotice(null)} />
  </div>;
}

