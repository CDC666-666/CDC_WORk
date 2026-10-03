"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Dialog } from "@/components/shared/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useReflections } from "@/hooks/use-reflections";
import { toLocalDateKey } from "@/lib/date";
import { canonicalReflectionDate, filterReflections, reflectionPeriodLabel, reflectionTypeLabels } from "@/services/reflection-period";
import type { Review, ReviewType } from "@/types/review";

type Draft = Omit<Review, "id"> & { id?: string };
const reviewTypes: ReviewType[] = ["DAILY", "WEEKLY", "MONTHLY", "PROJECT"];

function emptyDraft(): Draft {
  return { type: "DAILY", date: toLocalDateKey(), summary: "", achievement: "", problem: "", plan: "",
    relatedProjectId: undefined };
}

export function ReflectionsCenter({ initialProjectId, initialReviewId }: {
  initialProjectId: string; initialReviewId: string;
}) {
  const reflections = useReflections();
  const [typeFilter, setTypeFilter] = useState<ReviewType | "">("");
  const [projectFilter, setProjectFilter] = useState(initialProjectId);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [selectedId, setSelectedId] = useState(initialReviewId);
  const [deletingId, setDeletingId] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  const projects = reflections.projects;
  const projectName = (id?: string) => !id ? "未关联项目"
    : projects.find((item) => item.id === id)?.name ?? `失效关联：${id}`;
  const sorted = useMemo(() => [...reflections.reviews].sort((a, b) =>
    b.date.localeCompare(a.date) || b.id.localeCompare(a.id)), [reflections.reviews]);
  const visible = filterReflections(sorted, { type: typeFilter || undefined,
    relatedProjectId: projectFilter || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined });
  const selected = reflections.reviews.find((item) => item.id === selectedId);
  const deleting = reflections.reviews.find((item) => item.id === deletingId);

  const openForm = (item?: Review) => {
    reflections.clearError();
    setFormError("");
    setDraft(item ? { ...item } : emptyDraft());
  };
  const changeType = (type: ReviewType) => setDraft((item) => item && {
    ...item, type, date: canonicalReflectionDate(type, item.date),
  });

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    setFormError("");
    const { id, ...values } = draft;
    try {
      const saved = id ? await reflections.update(id, values) : await reflections.create(values);
      setDraft(null);
      setSelectedId(saved.id);
      setNotice("总结已保存。");
    } catch (cause: unknown) {
      setFormError(cause instanceof Error ? cause.message : "保存失败，请重试。");
    }
  };

  const remove = async () => {
    if (!deletingId) return;
    try {
      await reflections.delete(deletingId);
      if (selectedId === deletingId) setSelectedId("");
      setDeletingId("");
      setNotice("总结已删除。");
    } catch (cause: unknown) {
      setFormError(cause instanceof Error ? cause.message : "删除失败，请重试。");
      setDeletingId("");
    }
  };

  if (reflections.isLoading) return <p role="status" className="p-6 text-sm text-slate-500">正在加载总结与复盘…</p>;
  if (reflections.loadError && reflections.error && !draft) return <div className="space-y-4"><EmptyState title="总结数据读取失败" description={reflections.error} /><Button onClick={() => { void reflections.reload().catch(() => undefined); }}>重试</Button></div>;

  return <div className="space-y-5 lg:space-y-6">
    <PageHeader eyebrow="REFLECTIONS" title="总结与复盘" description="记录每天、每周、每月的成长，以及项目阶段的经验。记录保存在本地 Workspace v4。"
      actions={<Button onClick={() => openForm()}><Plus />新增总结</Button>} />
    {(reflections.error || formError) && <p role="alert" className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{formError || reflections.error}</p>}
    {notice && <p role="status" className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    <section aria-label="筛选总结" className="grid gap-3 rounded-lg border border-border bg-white p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-4">
      <label className="text-xs text-slate-600">类型<Select aria-label="筛选类型" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as ReviewType | "")}><option value="">全部类型</option>{reviewTypes.map((type) => <option key={type} value={type}>{reflectionTypeLabels[type]}</option>)}</Select></label>
      <label className="text-xs text-slate-600">关联项目<Select aria-label="筛选关联项目" value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}><option value="">全部项目</option>{projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></label>
      <label className="text-xs text-slate-600">开始日期<Input aria-label="筛选开始日期" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label>
      <label className="text-xs text-slate-600">结束日期<Input aria-label="筛选结束日期" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></label>
      <p className="text-xs text-slate-500 sm:col-span-2 xl:col-span-4">日期范围按记录日期筛选；每周和每月总结的记录日期为周期起点。</p>
    </section>
    {visible.length ? <section aria-label="总结列表" className="grid gap-4 lg:grid-cols-2">
      {visible.map((item) => <article key={item.id} className="min-w-0 rounded-lg border border-border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs"><span className="rounded bg-blue-50 px-2 py-1 font-medium text-blue-700">{reflectionTypeLabels[item.type]}</span><span className="text-slate-500">{reflectionPeriodLabel(item.type, item.date)}</span></div>
        <h2 className="mt-3 line-clamp-2 text-base font-semibold text-slate-900">{item.summary}</h2>
        <p className="mt-2 truncate text-xs text-slate-500">{projectName(item.relatedProjectId)}</p>
        <div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setSelectedId(item.id)}>查看详情</Button><Button size="sm" variant="ghost" onClick={() => openForm(item)}><Edit3 />编辑</Button><Button size="sm" variant="destructive" onClick={() => { setFormError(""); setDeletingId(item.id); }}><Trash2 />删除</Button></div>
      </article>)}
    </section> : <EmptyState title={reflections.reviews.length ? "没有符合条件的总结" : "还没有总结记录"} description={reflections.reviews.length ? "调整类型、项目或日期范围后重试。" : "从一条每日总结开始，记录今天的收获和下一步。"} actionLabel={reflections.reviews.length ? undefined : "新增总结"} onAction={reflections.reviews.length ? undefined : () => openForm()} />}

    <Dialog open={Boolean(selected)} title={selected ? reflectionTypeLabels[selected.type] : "查看总结"} onClose={() => setSelectedId("")} size="lg"
      footer={<><Button variant="outline" onClick={() => setSelectedId("")}>关闭</Button>{selected && <Button onClick={() => { openForm(selected); setSelectedId(""); }}>编辑总结</Button>}</>}>
      {selected && <div className="space-y-4 text-sm"><p className="text-xs text-slate-500">{reflectionPeriodLabel(selected.type, selected.date)} · {projectName(selected.relatedProjectId)}</p>
        {selected.relatedProjectId && projects.some((item) => item.id === selected.relatedProjectId) && <Link className="text-xs text-blue-700 hover:underline" href={`/projects/${selected.relatedProjectId}`}>查看关联项目</Link>}
        {([ ["总结", selected.summary], ["收获", selected.achievement], ["问题", selected.problem], ["计划", selected.plan] ] as const).map(([label, content]) => <section key={label}><h3 className="font-semibold">{label}</h3><p className="mt-1 whitespace-pre-wrap break-words leading-6 text-slate-600">{content || "未填写"}</p></section>)}</div>}
    </Dialog>

    <Dialog open={Boolean(draft)} title={draft?.id ? "编辑总结" : "新增总结"} size="lg" onClose={() => setDraft(null)}
      footer={<><Button variant="outline" onClick={() => setDraft(null)}>取消</Button><Button type="submit" form="reflection-form" disabled={reflections.isSaving}>保存总结</Button></>}>
      {draft && <form id="reflection-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        {formError && <p role="alert" className="rounded bg-rose-50 p-3 text-sm text-rose-700 sm:col-span-2">{formError}</p>}
        <label className="text-xs text-slate-600">类型<Select aria-label="总结类型" value={draft.type} onChange={(event) => changeType(event.target.value as ReviewType)}>{reviewTypes.map((type) => <option key={type} value={type}>{reflectionTypeLabels[type]}</option>)}</Select></label>
        <label className="text-xs text-slate-600">{draft.type === "WEEKLY" ? "周期起点（周一）" : draft.type === "MONTHLY" ? "周期起点（每月一日）" : draft.type === "PROJECT" ? "实际复盘日期" : "当天日期"}<Input aria-label="总结日期" type="date" value={draft.date} onChange={(event) => setDraft((item) => item && { ...item, date: event.target.value })} required /></label>
        <p className="text-xs text-blue-700 sm:col-span-2">{draft.date ? `对应周期：${reflectionPeriodLabel(draft.type, draft.date)}` : "请选择日期"}。周总结和月总结保存时自动归一到周期起点。</p>
        <label className="text-xs text-slate-600 sm:col-span-2">关联项目{draft.type === "PROJECT" ? "（必选）" : "（可选）"}<Select aria-label="总结关联项目" value={draft.relatedProjectId ?? ""} onChange={(event) => setDraft((item) => item && { ...item, relatedProjectId: event.target.value || undefined })} required={draft.type === "PROJECT"}><option value="">不关联项目</option>{projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>{draft.type === "PROJECT" && !projects.length && <Link className="mt-1 block text-blue-700" href="/projects">请先创建项目</Link>}</label>
        {([ ["总结", "summary"], ["收获", "achievement"], ["问题", "problem"], ["计划", "plan"] ] as const).map(([label, key]) => <label key={key} className="text-xs text-slate-600 sm:col-span-2">{label}<Textarea aria-label={label} value={draft[key]} required={key === "summary"} onChange={(event) => setDraft((item) => item && { ...item, [key]: event.target.value })} /></label>)}
      </form>}
    </Dialog>
    <ConfirmDialog open={Boolean(deleting)} title="删除总结" description={`确定删除“${deleting?.summary ?? "该记录"}”吗？关联附件存在时会拒绝删除。`} onCancel={() => setDeletingId("")} onConfirm={() => { void remove(); }} />
  </div>;
}
