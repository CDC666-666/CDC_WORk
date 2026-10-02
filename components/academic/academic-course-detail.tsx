"use client";

import Link from "next/link";
import { useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { ActionToast, type ToastNotice } from "@/components/layout/action-toast";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Dialog } from "@/components/shared/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAcademic } from "@/hooks/use-academic";
import { toLocalDateKey } from "@/lib/date";
import { isAssignmentOverdue } from "@/services/academic-selectors";
import type { AssignmentPriority, AssignmentStatus, ExamReviewStatus, ExamType } from "@/types/academic";

type RecordKind = "chapters" | "classSessions" | "assignments" | "exams";
type Editor = { kind: RecordKind; id?: string; title: string; content: string; date: string;
  summary: string; notes: string; description: string; deadline: string;
  status: AssignmentStatus; priority: AssignmentPriority; type: ExamType; reviewStatus: ExamReviewStatus };
type RecordRow = { kind: RecordKind; id: string; title: string; detail: string; meta: string; overdue?: boolean };
const labels: Record<RecordKind, string> = { chapters: "章节笔记", classSessions: "课堂记录", assignments: "作业", exams: "考试" };
const assignmentStatusLabels: Record<AssignmentStatus, string> = { TODO: "待开始", IN_PROGRESS: "进行中", COMPLETED: "已完成" };
const assignmentPriorityLabels: Record<AssignmentPriority, string> = { HIGH: "高优先级", MEDIUM: "中优先级", LOW: "低优先级" };
const examTypeLabels: Record<ExamType, string> = { QUIZ: "测验", MIDTERM: "期中", FINAL: "期末", OTHER: "其他" };
const examReviewLabels: Record<ExamReviewStatus, string> = { NOT_STARTED: "未开始", IN_PROGRESS: "进行中", READY: "已准备" };
const textareaClass = "min-h-24 w-full rounded-sm border border-input bg-background/70 px-3 py-2 text-sm outline-none focus-visible:border-primary/60";

export function AcademicCourseDetail({ courseId }: { courseId: string }) {
  const academic = useAcademic();
  const [editor, setEditor] = useState<Editor | null>(null);
  const [deleting, setDeleting] = useState<RecordRow | null>(null);
  const [notice, setNotice] = useState<ToastNotice | null>(null);
  const show = (title: string, description: string) => setNotice({ id: Date.now(), title, description });
  const course = academic.state.courses.find((item) => item.id === courseId);
  const semester = academic.state.semesters.find((item) => item.id === course?.semesterId);
  const today = toLocalDateKey();

  const rows: RecordKind[] = ["chapters", "classSessions", "assignments", "exams"];
  const entries: Record<RecordKind, RecordRow[]> = {
    chapters: academic.state.chapters.filter((item) => item.courseId === courseId).map((item) => ({
      kind: "chapters", id: item.id, title: item.title, detail: item.content, meta: item.learnDate || "未设置学习日期" })),
    classSessions: academic.state.classSessions.filter((item) => item.courseId === courseId).map((item) => ({
      kind: "classSessions", id: item.id, title: item.summary, detail: item.notes, meta: item.date })),
    assignments: academic.state.assignments.filter((item) => item.courseId === courseId).map((item) => ({
      kind: "assignments", id: item.id, title: item.title, detail: item.description,
      meta: `截止 ${item.deadline} · ${assignmentStatusLabels[item.status]} · ${assignmentPriorityLabels[item.priority]}`,
      overdue: isAssignmentOverdue(item, today) })),
    exams: academic.state.exams.filter((item) => item.courseId === courseId).map((item) => ({
      kind: "exams", id: item.id, title: `${examTypeLabels[item.type]}考试`, detail: `复习状态：${examReviewLabels[item.reviewStatus]}`, meta: item.date })),
  };

  const openEditor = (kind: RecordKind, id?: string) => {
    const base: Editor = { kind, id, title: "", content: "", date: today, summary: "", notes: "",
      description: "", deadline: today, status: "TODO", priority: "MEDIUM", type: "QUIZ", reviewStatus: "NOT_STARTED" };
    if (kind === "chapters") {
      const item = academic.state.chapters.find((record) => record.id === id);
      setEditor(item ? { ...base, title: item.title, content: item.content, date: item.learnDate || today } : base);
    } else if (kind === "classSessions") {
      const item = academic.state.classSessions.find((record) => record.id === id);
      setEditor(item ? { ...base, date: item.date, summary: item.summary, notes: item.notes } : base);
    } else if (kind === "assignments") {
      const item = academic.state.assignments.find((record) => record.id === id);
      setEditor(item ? { ...base, title: item.title, description: item.description, deadline: item.deadline,
        status: item.status, priority: item.priority } : base);
    } else {
      const item = academic.state.exams.find((record) => record.id === id);
      setEditor(item ? { ...base, date: item.date, type: item.type, reviewStatus: item.reviewStatus } : base);
    }
  };
  const change = <K extends keyof Editor,>(key: K, value: Editor[K]) =>
    setEditor((current) => current && { ...current, [key]: value });

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editor) return;
    try {
      if (editor.kind === "chapters") {
        const draft = { courseId, title: editor.title.trim(), content: editor.content.trim(), learnDate: editor.date || undefined };
        if (!draft.title) throw new Error("请填写章节标题。");
        if (editor.id) await academic.update("chapters", editor.id, draft);
        else await academic.create("chapters", draft);
      } else if (editor.kind === "classSessions") {
        const draft = { courseId, date: editor.date, summary: editor.summary.trim(), notes: editor.notes.trim() };
        if (!draft.date || !draft.summary) throw new Error("请填写课堂日期和摘要。");
        if (editor.id) await academic.update("classSessions", editor.id, draft);
        else await academic.create("classSessions", draft);
      } else if (editor.kind === "assignments") {
        const draft = { courseId, title: editor.title.trim(), description: editor.description.trim(),
          deadline: editor.deadline, status: editor.status, priority: editor.priority };
        if (!draft.title || !/^\d{4}-\d{2}-\d{2}$/.test(draft.deadline)) throw new Error("请填写作业标题和有效截止日期。");
        if (editor.id) await academic.update("assignments", editor.id, draft);
        else await academic.create("assignments", draft);
      } else {
        const draft = { courseId, date: editor.date, type: editor.type, reviewStatus: editor.reviewStatus };
        if (!draft.date) throw new Error("请填写考试日期。");
        if (editor.id) await academic.update("exams", editor.id, draft);
        else await academic.create("exams", draft);
      }
      setEditor(null);
      show("记录已保存", "课程数据已更新；作业会同步到首页和日历。");
    } catch (error: unknown) { show("保存失败", error instanceof Error ? error.message : "请重试。"); }
  };
  const remove = async () => {
    if (!deleting) return;
    try {
      await academic.delete(deleting.kind, deleting.id);
      show("记录已删除", "课程数据已更新；作业会同步到首页和日历。");
    } catch (error: unknown) { show("删除失败", error instanceof Error ? error.message : "请重试。"); }
    setDeleting(null);
  };

  if (academic.isLoading) return <p className="p-6 text-sm text-slate-500">正在加载课程…</p>;
  if (!course) return <div className="space-y-4"><EmptyState title="未找到课程" description={academic.error ?? "课程可能已删除。"} /><Button asChild variant="outline"><Link href="/academic">返回课程管理</Link></Button></div>;
  return <div className="space-y-5 lg:space-y-6">
    <PageHeader eyebrow="COURSE DETAIL" title={course.name} description={`${semester?.name ?? "未知学期"} · ${course.type === "MAJOR" ? "专业课" : "通识课程"} · ${course.credits} 学分 · ${course.teacher || "未填写教师"}`} actions={<Button asChild variant="outline"><Link href="/academic">返回课程管理</Link></Button>} />
    {academic.error && <p role="alert" className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{academic.error}</p>}
    <div className="grid gap-5 xl:grid-cols-2">{rows.map((kind) => <section key={kind} className="min-w-0 rounded-lg border border-border bg-white shadow-sm"><header className="flex items-center justify-between gap-3 border-b p-4"><div><h2 className="font-semibold">{labels[kind]}</h2><p className="mt-1 text-xs text-slate-500">{entries[kind].length} 条记录</p></div><Button size="sm" onClick={() => openEditor(kind)}><Plus />添加</Button></header>
      {entries[kind].length ? <div className="divide-y">{entries[kind].map((item) => <article key={item.id} className="p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h3 className="break-words text-sm font-medium">{item.title}</h3><p className="mt-1 text-xs text-slate-500">{item.meta} {item.overdue && <span className="font-semibold text-rose-700">· 逾期</span>}</p></div><div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => openEditor(kind, item.id)} aria-label={`编辑${item.title}`}><Edit3 /></Button><Button size="sm" variant="ghost" onClick={() => setDeleting(item)} aria-label={`删除${item.title}`}><Trash2 /></Button></div></div>{item.detail && <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-5 text-slate-600">{item.detail}</p>}</article>)}</div> : <p className="p-5 text-sm text-slate-500">暂无{labels[kind]}，点击添加开始记录。</p>}
    </section>)}</div>
    <Dialog open={Boolean(editor)} title={`${editor?.id ? "编辑" : "添加"}${editor ? labels[editor.kind] : "记录"}`} onClose={() => setEditor(null)} footer={<><Button variant="outline" onClick={() => setEditor(null)}>取消</Button><Button type="submit" form="academic-entry-form" disabled={academic.isSaving}>保存</Button></>}><form id="academic-entry-form" onSubmit={save} className="grid gap-3">
      {(editor?.kind === "chapters" || editor?.kind === "assignments") && <label className="text-xs">标题<Input aria-label="记录标题" value={editor.title} onChange={(event) => change("title", event.target.value)} required /></label>}
      {editor?.kind === "chapters" && <><label className="text-xs">学习日期<Input aria-label="章节学习日期" type="date" value={editor.date} onChange={(event) => change("date", event.target.value)} /></label><label className="text-xs">章节笔记<textarea aria-label="章节笔记内容" className={textareaClass} value={editor.content} onChange={(event) => change("content", event.target.value)} /></label></>}
      {editor?.kind === "classSessions" && <><label className="text-xs">课堂日期<Input aria-label="课堂日期" type="date" value={editor.date} onChange={(event) => change("date", event.target.value)} required /></label><label className="text-xs">课堂摘要<Input aria-label="课堂摘要" value={editor.summary} onChange={(event) => change("summary", event.target.value)} required /></label><label className="text-xs">课堂笔记<textarea aria-label="课堂笔记" className={textareaClass} value={editor.notes} onChange={(event) => change("notes", event.target.value)} /></label></>}
      {editor?.kind === "assignments" && <><label className="text-xs">截止日期<Input aria-label="作业截止日期" type="date" value={editor.deadline} onChange={(event) => change("deadline", event.target.value)} required /></label><label className="text-xs">说明<textarea aria-label="作业说明" className={textareaClass} value={editor.description} onChange={(event) => change("description", event.target.value)} /></label><label className="text-xs">状态<Select aria-label="作业状态" value={editor.status} onChange={(event) => change("status", event.target.value as AssignmentStatus)}><option value="TODO">待开始</option><option value="IN_PROGRESS">进行中</option><option value="COMPLETED">已完成</option></Select></label><label className="text-xs">优先级<Select aria-label="作业优先级" value={editor.priority} onChange={(event) => change("priority", event.target.value as AssignmentPriority)}><option value="HIGH">高</option><option value="MEDIUM">中</option><option value="LOW">低</option></Select></label></>}
      {editor?.kind === "exams" && <><label className="text-xs">考试日期<Input aria-label="考试日期" type="date" value={editor.date} onChange={(event) => change("date", event.target.value)} required /></label><label className="text-xs">类型<Select aria-label="考试类型" value={editor.type} onChange={(event) => change("type", event.target.value as ExamType)}><option value="QUIZ">测验</option><option value="MIDTERM">期中</option><option value="FINAL">期末</option><option value="OTHER">其他</option></Select></label><label className="text-xs">复习状态<Select aria-label="考试复习状态" value={editor.reviewStatus} onChange={(event) => change("reviewStatus", event.target.value as ExamReviewStatus)}><option value="NOT_STARTED">未开始</option><option value="IN_PROGRESS">进行中</option><option value="READY">已准备</option></Select></label></>}
    </form></Dialog>
    <ConfirmDialog open={Boolean(deleting)} title="删除课程记录" description={`确认删除“${deleting?.title ?? ""}”？此操作会同步移除首页与日历的派生展示。`} onCancel={() => setDeleting(null)} onConfirm={() => { void remove(); }} />
    <ActionToast notice={notice} onDismiss={() => setNotice(null)} />
  </div>;
}
