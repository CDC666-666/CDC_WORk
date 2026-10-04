"use client";

import { useEffect, useState } from "react";

import { Dialog } from "@/components/shared/dialog";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toLocalDateKey } from "@/lib/date";
import type { StudyPlan, StudySessionDraft } from "@/types/learning";

export function StudySessionDialog({ open, plan, onClose, onSubmit }: { open: boolean; plan: StudyPlan | null; onClose: () => void; onSubmit: (draft: StudySessionDraft) => Promise<unknown> | void }) {
  const [date, setDate] = useState(toLocalDateKey());
  const [minutes, setMinutes] = useState("60");
  const [content, setContent] = useState("");
  const [result, setResult] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { if (open) { setDate(toLocalDateKey()); setMinutes("60"); setContent(""); setResult(""); setNotes(""); setError(""); } }, [open, plan]);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const durationMinutes = Number(minutes);
    if (!plan || !content.trim() || durationMinutes <= 0) { setError("请填写学习内容，时长必须大于 0。"); return; }
    try {
      await onSubmit({ studyPlanId: plan.id, date, durationMinutes, content: content.trim(), result: result.trim(), notes: notes.trim() });
      onClose();
    } catch (cause: unknown) { setError(cause instanceof Error ? cause.message : "服务器保存失败。"); }
  };
  return <Dialog open={open} title={`记录学习${plan ? ` · ${plan.title}` : ""}`} description="保存后会自动累计计划完成时长。" onClose={onClose} footer={<><Button variant="outline" onClick={onClose}>取消</Button><Button type="submit" form="study-session-form">保存记录</Button></>}>
    <form id="study-session-form" onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2"><FormField label="日期" htmlFor="session-date"><Input id="session-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></FormField><FormField label="学习时长（分钟）" htmlFor="session-minutes" error={error}><Input id="session-minutes" type="number" min="1" value={minutes} onChange={(event) => setMinutes(event.target.value)} /></FormField></div>
      <FormField label="学习内容" htmlFor="session-content"><Input id="session-content" value={content} onChange={(event) => setContent(event.target.value)} autoFocus /></FormField>
      <FormField label="学习结果" htmlFor="session-result"><Input id="session-result" value={result} onChange={(event) => setResult(event.target.value)} placeholder="例如：完成章节笔记" /></FormField>
      <FormField label="补充笔记" htmlFor="session-notes"><Textarea id="session-notes" value={notes} onChange={(event) => setNotes(event.target.value)} /></FormField>
    </form>
  </Dialog>;
}

