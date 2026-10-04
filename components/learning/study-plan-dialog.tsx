"use client";

import { useEffect, useState } from "react";

import { Dialog } from "@/components/shared/dialog";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toLocalDateKey } from "@/lib/date";
import type { StudyPlan, StudyPlanCategory, StudyPlanDraft, StudyPlanStatus } from "@/types/learning";

interface Props {
  open: boolean;
  plan: StudyPlan | null;
  onClose: () => void;
  onCreate: (draft: StudyPlanDraft) => Promise<unknown> | void;
  onUpdate: (plan: StudyPlan) => Promise<unknown> | void;
}

function initial(plan: StudyPlan | null) {
  return plan ? {
    title: plan.title, category: plan.category, description: plan.description,
    targetHours: String(plan.targetHours), completedHours: String(plan.completedHours),
    deadline: plan.deadline, nextAction: plan.nextAction, status: plan.status, tags: plan.tags.join(", "),
  } : {
    title: "", category: "课程" as StudyPlanCategory, description: "", targetHours: "20",
    completedHours: "0", deadline: toLocalDateKey(), nextAction: "", status: "未开始" as StudyPlanStatus, tags: "",
  };
}

export function StudyPlanDialog({ open, plan, onClose, onCreate, onUpdate }: Props) {
  const [form, setForm] = useState(() => initial(plan));
  const [error, setError] = useState("");
  useEffect(() => { if (open) { setForm(initial(plan)); setError(""); } }, [open, plan]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const targetHours = Number(form.targetHours);
    const completedHours = Math.max(0, Number(form.completedHours));
    if (!form.title.trim() || targetHours <= 0) { setError("请填写标题，目标时长必须大于 0。"); return; }
    const draft: StudyPlanDraft = {
      title: form.title.trim(), category: form.category, description: form.description.trim(),
      targetHours, completedHours, deadline: form.deadline, nextAction: form.nextAction.trim(),
      status: form.status, tags: form.tags.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean),
    };
    try {
      if (plan) await onUpdate({ ...plan, ...draft }); else await onCreate(draft);
      onClose();
    } catch (cause: unknown) { setError(cause instanceof Error ? cause.message : "服务器保存失败。"); }
  };

  return <Dialog open={open} title={plan ? "编辑学习计划" : "新增学习计划"} description="管理目标时长、截止日期与下一步行动。" onClose={onClose} size="lg" footer={<><Button variant="outline" onClick={onClose}>取消</Button><Button type="submit" form="study-plan-form">{plan ? "保存修改" : "创建计划"}</Button></>}>
    <form id="study-plan-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2"><FormField label="计划标题" htmlFor="plan-title" error={error}><Input id="plan-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} autoFocus /></FormField></div>
      <FormField label="类别" htmlFor="plan-category"><Select id="plan-category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as StudyPlanCategory })}>{(["课程", "技术", "考试", "项目", "阶段目标"] as StudyPlanCategory[]).map((item) => <option key={item}>{item}</option>)}</Select></FormField>
      <FormField label="状态" htmlFor="plan-status"><Select id="plan-status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as StudyPlanStatus })}>{(["未开始", "进行中", "已完成", "已暂停"] as StudyPlanStatus[]).map((item) => <option key={item}>{item}</option>)}</Select></FormField>
      <FormField label="目标时长（小时）" htmlFor="plan-target"><Input id="plan-target" type="number" min="0.5" step="0.5" value={form.targetHours} onChange={(event) => setForm({ ...form, targetHours: event.target.value })} /></FormField>
      <FormField label="已完成时长（小时）" htmlFor="plan-completed"><Input id="plan-completed" type="number" min="0" step="0.25" value={form.completedHours} onChange={(event) => setForm({ ...form, completedHours: event.target.value })} /></FormField>
      <FormField label="截止日期" htmlFor="plan-deadline"><Input id="plan-deadline" type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} /></FormField>
      <FormField label="下一步行动" htmlFor="plan-action"><Input id="plan-action" value={form.nextAction} onChange={(event) => setForm({ ...form, nextAction: event.target.value })} /></FormField>
      <div className="sm:col-span-2"><FormField label="说明" htmlFor="plan-description"><Textarea id="plan-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></FormField></div>
      <div className="sm:col-span-2"><FormField label="标签" htmlFor="plan-tags"><Input id="plan-tags" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="使用逗号分隔" /></FormField></div>
    </form>
  </Dialog>;
}

