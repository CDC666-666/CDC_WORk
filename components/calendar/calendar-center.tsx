"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Edit3, Plus, Trash2 } from "lucide-react";

import { CalendarEventDialog } from "@/components/calendar/calendar-event-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useWorkspaceData } from "@/hooks/use-workspace-data";
import { useAcademic } from "@/hooks/use-academic";
import { formatChineseDate, toLocalDateKey } from "@/lib/date";
import { cn } from "@/lib/utils";
import { selectDerivedCalendarEvents } from "@/services/workspace-selectors";
import { isAssignmentOverdue, selectAssignmentCalendarEvents } from "@/services/academic-selectors";
import { createWorkspaceId } from "@/services/workspace-service";
import type { CalendarEvent, CalendarEventDraft, CalendarEventType } from "@/types/calendar";
import type { AcademicState, WorkspaceData } from "@/types/workspace";

type CalendarView = "month" | "week" | "list";

const weekdays = ["一", "二", "三", "四", "五", "六", "日"];
const viewLabels: Record<CalendarView, string> = {
  month: "月视图",
  week: "周视图",
  list: "日程列表",
};

function monthCells(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  const weekday = first.getDay() || 7;
  start.setDate(first.getDate() - weekday + 1);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function eventHref(event: CalendarEvent, data: WorkspaceData, academic: AcademicState): string | undefined {
  if (event.sourceType === "assignment" && event.sourceId) {
    const assignment = academic.assignments.find((item) => item.id === event.sourceId);
    return assignment ? `/academic/${assignment.courseId}` : undefined;
  }
  if (event.sourceType === "task" && event.sourceId && data.tasks.some((item) => item.id === event.sourceId)) return "/today";
  if (event.sourceType === "studyPlan" && event.sourceId && data.studyPlans.some((item) => item.id === event.sourceId)) return "/learning";
  if (event.sourceType === "reading" && event.sourceId && data.readingItems.some((item) => item.id === event.sourceId)) return "/reading";
  if (event.sourceType === "milestone" && event.sourceId) {
    const milestone = data.projectMilestones.find((item) => item.id === event.sourceId);
    if (milestone && data.projects.some((item) => item.id === milestone.projectId)) {
      return `/projects/${milestone.projectId}`;
    }
  }
  return undefined;
}

function EventLabel({ event, overdue }: { event: CalendarEvent; overdue: boolean }) {
  return <span className={cn("block truncate rounded px-1.5 py-1 text-[10px]", overdue ? "bg-rose-50 text-rose-700" : "bg-blue-50 text-blue-700")}>{overdue ? "逾期 · " : ""}{event.title}</span>;
}

export function CalendarCenter() {
  const { data, dispatch } = useWorkspaceData();
  const academic = useAcademic();
  const [month, setMonth] = useState(() => new Date());
  const [view, setView] = useState<CalendarView>("month");
  const [type, setType] = useState<CalendarEventType | "全部">("全部");
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<CalendarEvent | null>(null);

  const events = useMemo(() => [...selectDerivedCalendarEvents(data), ...selectAssignmentCalendarEvents(academic.state)]
    .filter((event) => event.sourceType === "manual" || Boolean(eventHref(event, data, academic.state)))
    .filter((event) => type === "全部" || event.eventType === type)
    .sort((left, right) => left.startAt.localeCompare(right.startAt)), [academic.state, data, type]);
  const overdue = (event: CalendarEvent) => event.sourceType === "assignment" &&
    academic.state.assignments.some((item) => item.id === event.sourceId && isAssignmentOverdue(item, toLocalDateKey()));
  const cells = monthCells(month);
  const monthLabel = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long" }).format(month);

  const save = async (draft: CalendarEventDraft, current: CalendarEvent | null) => {
    const now = new Date().toISOString();
    await dispatch(current
      ? { type: "calendar/updated", event: { ...current, ...draft, sourceType: "manual", sourceId: undefined, updatedAt: now } }
      : { type: "calendar/added", event: { ...draft, sourceType: "manual", sourceId: undefined, id: createWorkspaceId("event"), createdAt: now, updatedAt: now } });
  };

  const visibleListEvents = view === "week"
    ? events.filter((event) => {
        const timestamp = new Date(event.startAt).getTime();
        return timestamp >= Date.now() && timestamp <= Date.now() + 7 * 86_400_000;
      })
    : events;

  return <div className="space-y-5">
    <PageHeader eyebrow="CALENDAR" title="日历计划" description="任务、学习、阅读和项目里程碑通过派生进入日历，手动日程单独维护。" actions={<Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus />新增手动日程</Button>} />
    <section className="flex flex-wrap items-center gap-2 rounded-lg border bg-white p-4">
      <Button variant="outline" size="icon" aria-label="上一月" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft /></Button>
      <Button variant="outline" onClick={() => setMonth(new Date())}>今天</Button>
      <Button variant="outline" size="icon" aria-label="下一月" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight /></Button>
      <h2 className="mx-2 font-semibold">{monthLabel}</h2>
      <div className="ml-auto flex gap-1">{(["month", "week", "list"] as CalendarView[]).map((item) => <button type="button" key={item} onClick={() => setView(item)} className={cn("rounded px-3 py-2 text-xs", view === item ? "bg-blue-600 text-white" : "bg-slate-100")}>{viewLabels[item]}</button>)}</div>
      <Select aria-label="日历事件类型" className="w-36" value={type} onChange={(event) => setType(event.target.value as CalendarEventType | "全部")}><option>全部</option>{(["课程", "任务", "学习", "阅读", "项目", "比赛", "个人"] as CalendarEventType[]).map((item) => <option key={item}>{item}</option>)}</Select>
    </section>

    {view === "month" && <section className="hidden overflow-hidden rounded-lg border bg-white md:block"><div className="grid grid-cols-7 border-b">{weekdays.map((day) => <div key={day} className="p-2 text-center text-xs text-slate-500">周{day}</div>)}</div><div className="grid grid-cols-7">{cells.map((date) => {
      const key = toLocalDateKey(date);
      const dayEvents = events.filter((event) => toLocalDateKey(new Date(event.startAt)) === key);
      return <div key={key} className={cn("min-h-28 border-b border-r p-2", date.getMonth() !== month.getMonth() && "bg-slate-50 text-slate-400")}><p className="text-xs">{date.getDate()}</p><div className="mt-1 space-y-1">{dayEvents.slice(0, 3).map((event) => {
        const href = eventHref(event, data, academic.state);
        return href
          ? <Link key={event.id} href={href}><EventLabel event={event} overdue={overdue(event)} /></Link>
          : <button type="button" key={event.id} className="block w-full text-left" onClick={() => { setEditing(event); setFormOpen(true); }}><EventLabel event={event} overdue={false} /></button>;
        })}{dayEvents.length > 3 && <button type="button" className="text-xs text-blue-700 hover:underline" onClick={() => setView("list")}>另有 {dayEvents.length - 3} 条，查看列表</button>}</div></div>;
    })}</div></section>}

    <section className={cn("rounded-lg border bg-white", view === "month" ? "md:hidden" : "")}>
      <header className="border-b p-4"><h2 className="font-semibold">{view === "week" ? "未来 7 天" : "日程列表"}</h2></header>
      {visibleListEvents.length ? <div className="divide-y">{visibleListEvents.map((event) => {
        const href = eventHref(event, data, academic.state);
        return <article key={event.id} className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"><div><div className="flex gap-2 text-[10px]"><span className="rounded bg-blue-50 px-2 py-1 text-blue-700">{event.eventType}</span><span>{event.sourceType === "manual" ? "手动日程" : "派生日程"}</span>{overdue(event) && <span className="text-rose-700">逾期</span>}</div><p className="mt-2 text-sm font-medium">{event.title}</p><p className="mt-1 text-xs text-slate-500">{formatChineseDate(event.startAt)} {event.allDay ? "全天" : new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(event.startAt))}</p></div>{event.sourceType === "manual" ? <div className="flex gap-2"><Button size="sm" variant="ghost" onClick={() => { setEditing(event); setFormOpen(true); }}><Edit3 />编辑</Button><Button size="sm" variant="destructive" onClick={() => setDeleting(event)}><Trash2 />删除</Button></div> : href ? <Button asChild size="sm" variant="outline"><Link href={href}>查看来源</Link></Button> : null}</article>;
      })}</div> : <EmptyState title="当前没有日程" description="新增手动日程，或在任务、学习、阅读和项目中设置日期。" />}
    </section>
    <CalendarEventDialog open={formOpen} event={editing} onClose={() => setFormOpen(false)} onSubmit={save} />
    <ConfirmDialog open={Boolean(deleting)} title="删除手动日程" description="只删除这条手动日程；任务、学习、阅读和项目数据不会受影响。" onCancel={() => setDeleting(null)} onConfirm={() => { if (!deleting) return; void dispatch({ type: "calendar/deleted", eventId: deleting.id }).then(() => setDeleting(null)).catch((cause: unknown) => window.alert(cause instanceof Error ? cause.message : "删除失败。")); }} />
  </div>;
}
