"use client";

import { useMemo, useState } from "react";
import { Clock3, Edit3, Plus, TimerReset, Trash2 } from "lucide-react";

import { StudyPlanDialog } from "@/components/learning/study-plan-dialog";
import { StudySessionDialog } from "@/components/learning/study-session-dialog";
import { ActionToast, type ToastNotice } from "@/components/layout/action-toast";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { useWorkspaceData } from "@/hooks/use-workspace-data";
import { formatChineseDate, isDateInCurrentWeek } from "@/lib/date";
import type { StudyPlan, StudyPlanCategory, StudyPlanDraft, StudyPlanStatus } from "@/types/learning";

export function LearningCenter() {
  const workspace = useWorkspaceData();
  const [category, setCategory] = useState<StudyPlanCategory | "全部">("全部");
  const [status, setStatus] = useState<StudyPlanStatus | "全部">("全部");
  const [editing, setEditing] = useState<StudyPlan | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [sessionPlan, setSessionPlan] = useState<StudyPlan | null>(null);
  const [deleting, setDeleting] = useState<StudyPlan | null>(null);
  const [notice, setNotice] = useState<ToastNotice | null>(null);
  const show = (title: string, description: string) => setNotice({ id: Date.now(), title, description });
  const plans = useMemo(() => workspace.data.studyPlans.filter((plan) => (category === "全部" || plan.category === category) && (status === "全部" || plan.status === status)), [category, status, workspace.data.studyPlans]);
  const weeklyMinutes = workspace.data.studySessions.filter((session) => isDateInCurrentWeek(session.date)).reduce((sum, session) => sum + session.durationMinutes, 0);
  const recentSessions = [...workspace.data.studySessions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
  const planById = new Map(workspace.data.studyPlans.map((plan) => [plan.id, plan.title]));

  return <div className="space-y-5 lg:space-y-6">
    <PageHeader eyebrow="LEARNING LOOP" title="学习中心" description="管理课程、技术与项目学习计划，并用每次学习记录形成时长闭环。" actions={<Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus />新增学习计划</Button>} />
    <section className="grid gap-3 sm:grid-cols-3"><article className="rounded-lg border border-border bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">本周学习</p><p className="mt-1 text-2xl font-semibold text-slate-950">{(weeklyMinutes / 60).toFixed(1)} 小时</p></article><article className="rounded-lg border border-border bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">进行中计划</p><p className="mt-1 text-2xl font-semibold text-slate-950">{workspace.data.studyPlans.filter((plan) => plan.status === "进行中").length}</p></article><article className="rounded-lg border border-border bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">学习记录</p><p className="mt-1 text-2xl font-semibold text-slate-950">{workspace.data.studySessions.length}</p></article></section>
    <div className="grid gap-3 rounded-lg border border-border bg-white p-4 sm:grid-cols-2"><Select aria-label="按学习类别筛选" value={category} onChange={(event) => setCategory(event.target.value as StudyPlanCategory | "全部")}><option>全部</option>{(["课程", "技术", "考试", "项目", "阶段目标"] as StudyPlanCategory[]).map((item) => <option key={item}>{item}</option>)}</Select><Select aria-label="按学习状态筛选" value={status} onChange={(event) => setStatus(event.target.value as StudyPlanStatus | "全部")}><option>全部</option>{(["未开始", "进行中", "已完成", "已暂停"] as StudyPlanStatus[]).map((item) => <option key={item}>{item}</option>)}</Select></div>
    {plans.length ? <section className="grid gap-4 xl:grid-cols-2">{plans.map((plan) => <article key={plan.id} className="rounded-lg border border-border bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap gap-2"><span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] text-blue-700">{plan.category}</span><span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">{plan.status}</span></div><h2 className="mt-3 text-base font-semibold text-slate-950">{plan.title}</h2><p className="mt-2 text-xs leading-5 text-slate-500">{plan.description}</p></div><span className="text-xl font-semibold text-blue-700">{plan.progress}%</span></div><Progress value={plan.progress} className="mt-4 h-2 bg-slate-100" /><div className="mt-3 flex flex-wrap justify-between gap-2 text-[11px] text-slate-500"><span>{plan.completedHours.toFixed(1)} / {plan.targetHours} 小时</span><span>截止 {formatChineseDate(plan.deadline)}</span></div><div className="mt-4 rounded-md bg-slate-50 p-3"><p className="text-[10px] font-semibold text-slate-500">下一步行动</p><p className="mt-1 text-xs text-slate-700">{plan.nextAction || "尚未设置"}</p></div><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" onClick={() => setSessionPlan(plan)}><Clock3 />记录学习</Button><Button size="sm" variant="outline" onClick={() => { setEditing(plan); setFormOpen(true); }}><TimerReset />更新进度</Button><Button size="sm" variant="ghost" onClick={() => { setEditing(plan); setFormOpen(true); }}><Edit3 />编辑</Button><Button size="sm" variant="destructive" onClick={() => setDeleting(plan)}><Trash2 />删除</Button></div></article>)}</section> : <EmptyState title={workspace.data.studyPlans.length ? "没有符合条件的学习计划" : "还没有学习计划"} description="调整筛选条件，或创建一个新的学习目标。" actionLabel="新增学习计划" onAction={() => { setEditing(null); setFormOpen(true); }} />}
    <section className="rounded-lg border border-border bg-white shadow-sm"><header className="border-b border-border p-5"><h2 className="text-base font-semibold text-slate-900">最近学习记录</h2><p className="mt-1 text-xs text-slate-500">每次记录都会累计到对应计划。</p></header><div className="divide-y divide-border">{recentSessions.length ? recentSessions.map((session) => <article key={session.id} className="grid gap-2 p-4 sm:grid-cols-[140px_1fr_auto]"><div><p className="text-xs font-medium text-slate-700">{formatChineseDate(session.date)}</p><p className="mt-1 text-[10px] text-slate-400">{session.durationMinutes} 分钟</p></div><div><p className="text-sm font-medium text-slate-800">{session.content}</p><p className="mt-1 text-xs text-slate-500">{session.result || "未填写学习结果"}</p></div><span className="text-[11px] text-blue-600">{planById.get(session.studyPlanId) ?? "已删除计划"}</span></article>) : <p className="p-5 text-sm text-slate-500">还没有学习记录。</p>}</div></section>
    <StudyPlanDialog open={formOpen} plan={editing} onClose={() => setFormOpen(false)} onCreate={(draft: StudyPlanDraft) => { workspace.addStudyPlan(draft); show("计划已创建", "学习计划已同步到首页。 "); }} onUpdate={(plan) => { workspace.updateStudyPlan(plan); show("计划已更新", "进度与下一步行动已保存。 "); }} />
    <StudySessionDialog open={Boolean(sessionPlan)} plan={sessionPlan} onClose={() => setSessionPlan(null)} onSubmit={(draft) => { workspace.addStudySession(draft); show("学习记录已保存", "累计时长和首页本周学习数据已更新。 "); }} />
    <ConfirmDialog open={Boolean(deleting)} title="删除学习计划" description={`删除“${deleting?.title ?? "该计划"}”会同时删除其学习记录。`} onCancel={() => setDeleting(null)} onConfirm={() => { if (deleting) workspace.deleteStudyPlan(deleting.id); setDeleting(null); show("学习计划已删除", "关联学习记录已一并清理。 "); }} />
    <ActionToast notice={notice} onDismiss={() => setNotice(null)} />
  </div>;
}

