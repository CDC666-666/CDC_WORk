"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Copy, Edit3, Plus, RotateCcw, Trash2 } from "lucide-react";

import { ActionToast, type ToastNotice } from "@/components/layout/action-toast";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useWorkspaceData } from "@/hooks/use-workspace-data";
import { combineDateAndTime, formatChineseDateTime, toLocalDateKey } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { Priority, Task, TaskDomain, TaskDraft, TaskStatus } from "@/types/task";

type TaskView = "today" | "upcoming" | "completed" | "all";
type TaskSort = "due" | "priority" | "created" | "estimate";

const priorityRank: Record<Priority, number> = { 高: 0, 中: 1, 低: 2 };
const views: { id: TaskView; label: string }[] = [
  { id: "today", label: "今天" },
  { id: "upcoming", label: "即将到来" },
  { id: "completed", label: "已完成" },
  { id: "all", label: "全部" },
];

export function TaskManager({ openCreate = false }: { openCreate?: boolean }) {
  const workspace = useWorkspaceData();
  const [view, setView] = useState<TaskView>("today");
  const [status, setStatus] = useState<TaskStatus | "全部">("全部");
  const [priority, setPriority] = useState<Priority | "全部">("全部");
  const [domain, setDomain] = useState<TaskDomain | "全部">("全部");
  const [date, setDate] = useState("");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState<TaskSort>("due");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formOpen, setFormOpen] = useState(openCreate);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [notice, setNotice] = useState<ToastNotice | null>(null);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickDomain, setQuickDomain] = useState<TaskDomain>("个人管理");
  const [quickPriority, setQuickPriority] = useState<Priority>("中");
  const [quickDate, setQuickDate] = useState(toLocalDateKey());
  const [quickTime, setQuickTime] = useState("21:00");
  const [quickHours, setQuickHours] = useState("1");
  const today = toLocalDateKey();

  const todayTasks = workspace.data.tasks.filter((task) => task.scheduledDate === today);
  const completed = todayTasks.filter((task) => task.status === "已完成").length;
  const inProgress = todayTasks.filter((task) => task.status === "进行中").length;
  const totalHours = todayTasks.reduce((sum, task) => sum + task.estimateHours, 0);
  const completion = todayTasks.length ? Math.round((completed / todayTasks.length) * 100) : 0;

  const filteredTasks = useMemo(() => {
    const current = workspace.data.tasks.filter((task) => {
      if (view === "today" && task.scheduledDate !== today) return false;
      if (view === "upcoming" && task.scheduledDate <= today) return false;
      if (view === "completed" && task.status !== "已完成") return false;
      if (status !== "全部" && task.status !== status) return false;
      if (priority !== "全部" && task.priority !== priority) return false;
      if (domain !== "全部" && task.domain !== domain) return false;
      if (date && task.scheduledDate !== date) return false;
      if (tag && !task.tags.some((item) => item.toLowerCase().includes(tag.toLowerCase()))) return false;
      return true;
    });
    return [...current].sort((left, right) => {
      if (sort === "priority") return priorityRank[left.priority] - priorityRank[right.priority];
      if (sort === "created") return right.createdAt.localeCompare(left.createdAt);
      if (sort === "estimate") return right.estimateHours - left.estimateHours;
      return left.dueAt.localeCompare(right.dueAt);
    });
  }, [date, domain, priority, sort, status, tag, today, view, workspace.data.tasks]);

  const showNotice = (title: string, description: string) => setNotice({ id: Date.now(), title, description });

  const quickCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const estimateHours = Number(quickHours);
    if (!quickTitle.trim() || estimateHours <= 0) {
      showNotice("无法创建任务", "请填写任务标题，并确保预计耗时大于 0。 ");
      return;
    }
    try { await workspace.addTask({
      title: quickTitle.trim(), description: "", status: "待开始", priority: quickPriority,
      domain: quickDomain, scheduledDate: quickDate, dueAt: combineDateAndTime(quickDate, quickTime),
      estimateHours, actualHours: 0, tags: [], sourceType: "manual",
    });
      setQuickTitle("");
      showNotice("任务已创建", "新任务已同步到工作台首页。 ");
    } catch (cause: unknown) { showNotice("创建失败", cause instanceof Error ? cause.message : "服务器写入失败。"); }
  };

  const createTask = async (draft: TaskDraft) => {
    await workspace.addTask(draft);
    showNotice("任务已创建", "任务数据已保存到服务器。 ");
  };

  const hasAnyTasks = workspace.data.tasks.length > 0;
  const hasActiveFilters = status !== "全部" || priority !== "全部" || domain !== "全部" || Boolean(date || tag);

  return (
    <div className="space-y-5 lg:space-y-6">
      <PageHeader eyebrow="PERSONAL PLANNING" title="今日任务" description="管理今天、即将到来和长期任务，所有修改会立即同步到工作台。" actions={<Button onClick={() => { setEditingTask(null); setFormOpen(true); }}><Plus />新增任务</Button>} />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5" aria-label="今日任务统计">
        {[
          ["今日任务数", todayTasks.length], ["已完成", completed], ["进行中", inProgress],
          ["预计总耗时", `${totalHours.toFixed(1)}h`], ["完成率", `${completion}%`],
        ].map(([label, value]) => <article key={label} className="rounded-lg border border-border bg-white p-4 shadow-sm"><p className="text-[11px] text-slate-500">{label}</p><p className="mt-1 text-xl font-semibold text-slate-950">{value}</p></article>)}
      </section>

      <Card className="rounded-lg bg-white shadow-sm">
        <CardContent className="p-4">
          <form onSubmit={quickCreate} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-[minmax(220px,1fr)_150px_110px_145px_115px_110px_auto]">
            <Input aria-label="快速任务标题" placeholder="快速新增任务" value={quickTitle} onChange={(event) => setQuickTitle(event.target.value)} />
            <Select aria-label="快速任务领域" value={quickDomain} onChange={(event) => setQuickDomain(event.target.value as TaskDomain)}>{(["学校学习", "阅读成长", "项目研发", "内容学习", "个人管理"] as TaskDomain[]).map((item) => <option key={item}>{item}</option>)}</Select>
            <Select aria-label="快速任务优先级" value={quickPriority} onChange={(event) => setQuickPriority(event.target.value as Priority)}>{(["高", "中", "低"] as Priority[]).map((item) => <option key={item}>{item}</option>)}</Select>
            <Input aria-label="快速任务日期" type="date" value={quickDate} onChange={(event) => setQuickDate(event.target.value)} />
            <Input aria-label="快速任务截止时间" type="time" value={quickTime} onChange={(event) => setQuickTime(event.target.value)} />
            <Input aria-label="快速任务预计耗时" type="number" min="0.1" step="0.1" value={quickHours} onChange={(event) => setQuickHours(event.target.value)} />
            <Button type="submit"><Plus />添加</Button>
          </form>
        </CardContent>
      </Card>

      <section className="rounded-lg border border-border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2 border-b border-border pb-4">
          {views.map((item) => <button key={item.id} type="button" onClick={() => setView(item.id)} className={cn("rounded-md px-3 py-2 text-xs font-medium", view === item.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>{item.label}</button>)}
        </div>
        <div className="grid gap-3 py-4 sm:grid-cols-2 lg:grid-cols-6">
          <Select aria-label="按状态筛选" value={status} onChange={(event) => setStatus(event.target.value as TaskStatus | "全部")}><option>全部</option>{(["待开始", "进行中", "已完成", "受阻"] as TaskStatus[]).map((item) => <option key={item}>{item}</option>)}</Select>
          <Select aria-label="按优先级筛选" value={priority} onChange={(event) => setPriority(event.target.value as Priority | "全部")}><option>全部</option>{(["高", "中", "低"] as Priority[]).map((item) => <option key={item}>{item}</option>)}</Select>
          <Select aria-label="按领域筛选" value={domain} onChange={(event) => setDomain(event.target.value as TaskDomain | "全部")}><option>全部</option>{(["学校学习", "阅读成长", "项目研发", "内容学习", "个人管理"] as TaskDomain[]).map((item) => <option key={item}>{item}</option>)}</Select>
          <Input aria-label="按日期筛选" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          <Input aria-label="按标签筛选" placeholder="标签" value={tag} onChange={(event) => setTag(event.target.value)} />
          <Select aria-label="任务排序" value={sort} onChange={(event) => setSort(event.target.value as TaskSort)}><option value="due">截止时间</option><option value="priority">优先级</option><option value="created">创建时间</option><option value="estimate">预计耗时</option></Select>
        </div>
        {hasActiveFilters && <div className="mb-4"><Button variant="ghost" size="sm" onClick={() => { setStatus("全部"); setPriority("全部"); setDomain("全部"); setDate(""); setTag(""); }}>清除筛选</Button></div>}

        {filteredTasks.length ? <div className="space-y-3">{filteredTasks.map((task) => {
          const isCompleted = task.status === "已完成";
          return <article key={task.id} className="rounded-lg border border-slate-200 p-4">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className={cn("text-sm font-semibold", isCompleted ? "text-slate-400 line-through" : "text-slate-900")}>{task.title}</h2><span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">{task.status}</span><span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] text-blue-700">{task.domain}</span><span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700">{task.priority}优先级</span></div>
              {task.description && <p className="mt-2 text-xs leading-5 text-slate-500">{task.description}</p>}
              <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500"><span>截止 {formatChineseDateTime(task.dueAt)}</span><span>预计 {task.estimateHours}h</span>{task.tags.map((item) => <span key={item}>#{item}</span>)}</div></div>
              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" variant={isCompleted ? "outline" : "secondary"} onClick={() => { void workspace.toggleTaskCompleted(task.id).then(() => showNotice(isCompleted ? "任务已恢复" : "任务已完成", task.title)).catch((cause: unknown) => showNotice("保存失败", cause instanceof Error ? cause.message : "服务器写入失败。")); }}>{isCompleted ? <RotateCcw /> : <Check />}{isCompleted ? "恢复" : "完成"}</Button>
                <Button size="sm" variant="ghost" onClick={() => { setEditingTask(task); setFormOpen(true); }}><Edit3 />编辑</Button>
                <Button size="sm" variant="ghost" onClick={() => { void workspace.duplicateTask(task).then(() => showNotice("任务已复制", "副本已设为待开始状态。 ")).catch((cause: unknown) => showNotice("复制失败", cause instanceof Error ? cause.message : "服务器写入失败。")); }}><Copy />复制</Button>
                {task.projectId && <Button asChild size="sm" variant="ghost"><Link href={`/logs?projectId=${task.projectId}&taskId=${task.id}&create=1`}>写日志</Link></Button>}
                <Button size="sm" variant="destructive" onClick={() => setDeletingTask(task)}><Trash2 />删除</Button>
              </div>
            </div>
          </article>;
        })}</div> : <EmptyState title={hasAnyTasks ? "没有符合条件的任务" : "还没有任务"} description={hasAnyTasks ? "调整视图或清除筛选条件后再试。" : "创建第一条任务，开始建立个人执行闭环。"} actionLabel="新增任务" onAction={() => { setEditingTask(null); setFormOpen(true); }} />}
      </section>

      <TaskFormDialog open={formOpen} task={editingTask} onClose={() => setFormOpen(false)} onCreate={createTask} onUpdate={async (task) => { await workspace.updateTask(task); showNotice("任务已更新", "首页和任务页面已同步。 "); }} />
      <ConfirmDialog open={Boolean(deletingTask)} title="删除任务" description={`确定删除“${deletingTask?.title ?? "该任务"}”吗？`} onCancel={() => setDeletingTask(null)} onConfirm={() => { if (!deletingTask) return; void workspace.deleteTask(deletingTask.id).then(() => { showNotice("任务已删除", deletingTask.title); setDeletingTask(null); }).catch((cause: unknown) => showNotice("删除失败", cause instanceof Error ? cause.message : "服务器写入失败。")); }} />
      <ActionToast notice={notice} onDismiss={() => setNotice(null)} />
    </div>
  );
}
