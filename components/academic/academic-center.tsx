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
import type { Course, CourseImportance, CourseStatus, CourseType, Semester } from "@/types/academic";

type SemesterDraft = { id?: string; year: string; term: string; name: string };
type CourseDraft = { id?: string; semesterId: string; name: string; type: CourseType; teacher: string;
  credits: string; importance: string; status: CourseStatus };
type DeleteTarget = { kind: "semesters" | "courses"; id: string; name: string };

export function AcademicCenter() {
  const academic = useAcademic();
  const [semesterId, setSemesterId] = useState("");
  const [semesterDraft, setSemesterDraft] = useState<SemesterDraft | null>(null);
  const [courseDraft, setCourseDraft] = useState<CourseDraft | null>(null);
  const [deleting, setDeleting] = useState<DeleteTarget | null>(null);
  const [notice, setNotice] = useState<ToastNotice | null>(null);
  const show = (title: string, description: string) => setNotice({ id: Date.now(), title, description });
  const semesters = [...academic.state.semesters].sort((a, b) => b.year - a.year || b.term.localeCompare(a.term));
  const courses = academic.state.courses.filter((item) => !semesterId || item.semesterId === semesterId);
  const majors = courses.filter((item) => item.type === "MAJOR");
  const generals = courses.filter((item) => item.type === "GENERAL");

  const editSemester = (item?: Semester) => setSemesterDraft(item
    ? { id: item.id, year: String(item.year), term: item.term, name: item.name }
    : { year: String(new Date().getFullYear()), term: "SPRING", name: "" });
  const editCourse = (item?: Course) => setCourseDraft(item
    ? { ...item, credits: String(item.credits), importance: String(item.importance) }
    : { semesterId: semesterId || semesters[0]?.id || "", name: "", type: "MAJOR", teacher: "",
      credits: "2", importance: "3", status: "PLANNED" });

  const saveSemester = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!semesterDraft) return;
    const draft = { year: Number(semesterDraft.year), term: semesterDraft.term.trim(), name: semesterDraft.name.trim() };
    if (!Number.isInteger(draft.year) || !draft.term || !draft.name) { show("学期保存失败", "请填写有效的学期信息。"); return; }
    try {
      if (semesterDraft.id) await academic.update("semesters", semesterDraft.id, draft);
      else await academic.create("semesters", draft);
      setSemesterDraft(null);
      show("学期已保存", "数据已写入本地 Workspace。");
    } catch (error: unknown) { show("学期保存失败", error instanceof Error ? error.message : "请重试。"); }
  };
  const saveCourse = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!courseDraft) return;
    const credits = Number(courseDraft.credits);
    const importance = Number(courseDraft.importance) as CourseImportance;
    if (!courseDraft.semesterId || !courseDraft.name.trim() || !Number.isFinite(credits) || credits < 0 || importance < 1 || importance > 5) {
      show("课程保存失败", "请填写课程名、学期、有效学分和重要度。"); return;
    }
    const draft = { semesterId: courseDraft.semesterId, name: courseDraft.name.trim(), type: courseDraft.type,
      teacher: courseDraft.teacher.trim(), credits, importance, status: courseDraft.status };
    try {
      if (courseDraft.id) await academic.update("courses", courseDraft.id, draft);
      else await academic.create("courses", draft);
      setCourseDraft(null);
      show("课程已保存", "数据已写入本地 Workspace。");
    } catch (error: unknown) { show("课程保存失败", error instanceof Error ? error.message : "请重试。"); }
  };
  const remove = async () => {
    if (!deleting) return;
    try {
      await academic.delete(deleting.kind, deleting.id);
      show("记录已删除", "更改已保存。");
    } catch (error: unknown) { show("无法删除", error instanceof Error ? error.message : "请重试。"); }
    setDeleting(null);
  };

  const card = (course: Course) => <article key={course.id} className="rounded-lg border border-border bg-white p-5 shadow-sm">
    <p className="text-[11px] text-blue-700">{semesters.find((item) => item.id === course.semesterId)?.name ?? "未知学期"} · {course.credits} 学分</p>
    <h3 className="mt-2 text-base font-semibold">{course.name}</h3>
    <p className="mt-1 text-xs text-slate-500">{course.teacher || "未填写教师"} · {{ PLANNED: "计划中", IN_PROGRESS: "进行中", COMPLETED: "已完成", ARCHIVED: "已归档" }[course.status]} · 重要度 {course.importance}/5</p>
    <div className="mt-4 flex flex-wrap gap-2"><Button asChild size="sm"><Link href={`/academic/${course.id}`}>查看课程</Link></Button><Button size="sm" variant="ghost" onClick={() => editCourse(course)}><Edit3 />编辑</Button><Button size="sm" variant="destructive" onClick={() => setDeleting({ kind: "courses", id: course.id, name: course.name })}><Trash2 />删除</Button></div>
  </article>;

  if (academic.isLoading) return <p className="p-6 text-sm text-slate-500">正在加载课程数据…</p>;
  if (academic.error && !semesters.length && !courses.length) return <div className="space-y-4"><EmptyState title="课程数据读取失败" description={academic.error} /><Button onClick={() => { void academic.reload().catch(() => undefined); }}>重试</Button></div>;
  return <div className="space-y-5 lg:space-y-6">
    <PageHeader eyebrow="ACADEMIC" title="课程管理" description="按学期管理课程；专业课独立展示，通识课程归组展示并保留各自记录。" actions={<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => editSemester()}><Plus />新增学期</Button><Button disabled={!semesters.length} onClick={() => editCourse()}><Plus />新增课程</Button></div>} />
    {academic.error && <p role="alert" className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{academic.error}</p>}
    <section className="rounded-lg border bg-white p-4 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-semibold">学期</h2><Select aria-label="筛选学期" className="w-full sm:w-56" value={semesterId} onChange={(event) => setSemesterId(event.target.value)}><option value="">全部学期</option>{semesters.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></div>
      {semesters.length ? <div className="mt-3 flex flex-wrap gap-2">{semesters.map((item) => <div key={item.id} className="flex items-center gap-2 rounded border bg-slate-50 px-3 py-2 text-xs"><span>{item.name} · {item.year} {item.term}</span><button aria-label={`编辑学期${item.name}`} onClick={() => editSemester(item)} className="text-blue-700">编辑</button><button aria-label={`删除学期${item.name}`} onClick={() => setDeleting({ kind: "semesters", id: item.id, name: item.name })} className="text-rose-700">删除</button></div>)}</div> : <p className="mt-3 text-sm text-slate-500">还没有学期。先创建学期，再添加课程。</p>}
    </section>
    <section className="space-y-3"><h2 className="text-lg font-semibold">专业课 · {majors.length}</h2>{majors.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{majors.map(card)}</div> : <EmptyState title="暂无专业课" description="添加专业课后可进入课程详情。" />}</section>
    <section className="space-y-3"><h2 className="text-lg font-semibold">通识课程 · {generals.length}</h2>{generals.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{generals.map(card)}</div> : <EmptyState title="暂无通识课程" description="各门通识课程仍保留独立记录。" />}</section>
    <Dialog open={Boolean(semesterDraft)} title={semesterDraft?.id ? "编辑学期" : "新增学期"} onClose={() => setSemesterDraft(null)} footer={<><Button variant="outline" onClick={() => setSemesterDraft(null)}>取消</Button><Button type="submit" form="semester-form" disabled={academic.isSaving}>保存学期</Button></>}><form id="semester-form" onSubmit={saveSemester} className="grid gap-3"><label className="text-xs">年份<Input aria-label="学期年份" type="number" value={semesterDraft?.year ?? ""} onChange={(event) => setSemesterDraft((item) => item && { ...item, year: event.target.value })} required /></label><label className="text-xs">学期<Select aria-label="学期类型" value={semesterDraft?.term ?? "SPRING"} onChange={(event) => setSemesterDraft((item) => item && { ...item, term: event.target.value })}><option value="SPRING">春季</option><option value="AUTUMN">秋季</option><option value="SUMMER">夏季</option></Select></label><label className="text-xs">名称<Input aria-label="学期名称" value={semesterDraft?.name ?? ""} onChange={(event) => setSemesterDraft((item) => item && { ...item, name: event.target.value })} required placeholder="例如 2026 秋季学期" /></label></form></Dialog>
    <Dialog open={Boolean(courseDraft)} title={courseDraft?.id ? "编辑课程" : "新增课程"} onClose={() => setCourseDraft(null)} footer={<><Button variant="outline" onClick={() => setCourseDraft(null)}>取消</Button><Button type="submit" form="course-form" disabled={academic.isSaving}>保存课程</Button></>}><form id="course-form" onSubmit={saveCourse} className="grid gap-3 sm:grid-cols-2"><label className="text-xs sm:col-span-2">名称<Input aria-label="课程名称" value={courseDraft?.name ?? ""} onChange={(event) => setCourseDraft((item) => item && { ...item, name: event.target.value })} required /></label><label className="text-xs">学期<Select aria-label="课程学期" value={courseDraft?.semesterId ?? ""} onChange={(event) => setCourseDraft((item) => item && { ...item, semesterId: event.target.value })}>{semesters.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></label><label className="text-xs">类型<Select aria-label="课程类型" value={courseDraft?.type ?? "MAJOR"} onChange={(event) => setCourseDraft((item) => item && { ...item, type: event.target.value as CourseType })}><option value="MAJOR">专业课</option><option value="GENERAL">通识课程</option></Select></label><label className="text-xs">教师<Input aria-label="课程教师" value={courseDraft?.teacher ?? ""} onChange={(event) => setCourseDraft((item) => item && { ...item, teacher: event.target.value })} /></label><label className="text-xs">学分<Input aria-label="课程学分" type="number" min="0" step="0.5" value={courseDraft?.credits ?? ""} onChange={(event) => setCourseDraft((item) => item && { ...item, credits: event.target.value })} /></label><label className="text-xs">重要度<Select aria-label="课程重要度" value={courseDraft?.importance ?? "3"} onChange={(event) => setCourseDraft((item) => item && { ...item, importance: event.target.value })}>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}</Select></label><label className="text-xs">状态<Select aria-label="课程状态" value={courseDraft?.status ?? "PLANNED"} onChange={(event) => setCourseDraft((item) => item && { ...item, status: event.target.value as CourseStatus })}><option value="PLANNED">计划中</option><option value="IN_PROGRESS">进行中</option><option value="COMPLETED">已完成</option><option value="ARCHIVED">已归档</option></Select></label></form></Dialog>
    <ConfirmDialog open={Boolean(deleting)} title="删除课程记录" description={`确认删除“${deleting?.name ?? ""}”？存在下级记录时会拒绝删除并保留数据。`} onCancel={() => setDeleting(null)} onConfirm={() => { void remove(); }} />
    <ActionToast notice={notice} onDismiss={() => setNotice(null)} />
  </div>;
}
