"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Dialog } from "@/components/shared/dialog";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { evidenceStatuses, reviewStatuses, type ExperienceDraft } from "@/services/engineering-experience-service";
import type { EngineeringExperience, KnowledgeItem } from "@/types/knowledge";
import type { Project } from "@/types/project";

type FormState = Omit<EngineeringExperience, "evidenceSources"> & {
  title: string;
  projectId: string;
  tags: string;
  evidenceSources: string;
};

const blank: FormState = {
  title: "", projectId: "", tags: "", phenomenon: "", sourceProject: "", environment: "",
  sourceVersion: "待确认", investigation: "", failedAttempts: "未记录", cause: "", resolution: "",
  verificationResult: "", evidenceSources: "", applicability: "", limitations: "",
  openQuestions: "待确认", reviewStatus: "待审核", evidenceStatus: "待核实",
};

function stateFrom(item: KnowledgeItem | null): FormState {
  if (!item?.experience) return { ...blank };
  return { ...item.experience, title: item.title, projectId: item.projectId ?? "",
    tags: item.tags.join(", "), evidenceSources: item.experience.evidenceSources.join("\n") };
}

export function ExperienceEditor({ open, item, projects, onClose, onSubmit }: {
  open: boolean;
  item: KnowledgeItem | null;
  projects: Project[];
  onClose: () => void;
  onSubmit: (draft: ExperienceDraft, current: KnowledgeItem | null) => Promise<void>;
}) {
  const [form, setForm] = useState<FormState>({ ...blank });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) { setForm(stateFrom(item)); setError(""); } }, [item, open]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const { title, projectId, tags, evidenceSources, ...experience } = form;
    const draft: ExperienceDraft = { title, projectId: projectId || undefined,
      tags: tags.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean),
      experience: { ...experience, evidenceSources: evidenceSources.split(/\r?\n/).map((line) => line.trim()).filter(Boolean) } };
    setSaving(true);
    try { await onSubmit(draft, item); onClose(); }
    catch (cause: unknown) { setError(cause instanceof Error ? cause.message : "服务器保存失败。"); }
    finally { setSaving(false); }
  };

  const text = (key: keyof Pick<FormState, "phenomenon" | "environment" | "sourceVersion" |
    "investigation" | "failedAttempts" | "cause" | "resolution" | "verificationResult" |
    "evidenceSources" | "applicability" | "limitations" | "openQuestions">, label: string) =>
    <FormField label={label} htmlFor={`experience-${key}`}><Textarea id={`experience-${key}`}
      value={String(form[key])} onChange={(event) => set(key, event.target.value)} /></FormField>;

  return <Dialog open={open} title={item ? "编辑工程经验" : "新增工程经验"}
    description="审核表示内容已复核；证据状态只按实际来源填写，审核不会自动提高证据等级。"
    onClose={onClose} size="lg" footer={<><Button variant="outline" onClick={onClose}>取消</Button>
      <Button type="submit" form="experience-form" disabled={saving}>{saving ? "保存中…" : "保存经验"}</Button></>}>
    <form id="experience-form" onSubmit={submit} className="space-y-4">
      {error && <p role="alert" className="rounded bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <FormField label="标题" htmlFor="experience-title"><Input id="experience-title" value={form.title}
        onChange={(event) => set("title", event.target.value)} required /></FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="来源项目" htmlFor="experience-project"><Input id="experience-project" value={form.sourceProject}
          onChange={(event) => set("sourceProject", event.target.value)} placeholder="如 auto_aim" required /></FormField>
        <FormField label="关联工作台项目（可选）" htmlFor="experience-linked-project"><Select id="experience-linked-project"
          value={form.projectId} onChange={(event) => set("projectId", event.target.value)}><option value="">不关联</option>
          {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</Select></FormField>
        <FormField label="标签（逗号分隔）" htmlFor="experience-tags"><Input id="experience-tags" value={form.tags}
          onChange={(event) => set("tags", event.target.value)} /></FormField>
        <FormField label="审核状态" htmlFor="experience-review"><Select id="experience-review" value={form.reviewStatus}
          onChange={(event) => set("reviewStatus", event.target.value as FormState["reviewStatus"])}>
          {reviewStatuses.map((status) => <option key={status}>{status}</option>)}</Select></FormField>
        <FormField label="证据状态" htmlFor="experience-evidence"><Select id="experience-evidence"
          value={form.evidenceStatus} onChange={(event) => set("evidenceStatus", event.target.value as FormState["evidenceStatus"])}>
          {evidenceStatuses.map((status) => <option key={status}>{status}</option>)}</Select></FormField>
      </div>
      {text("phenomenon", "现象")}
      {text("environment", "环境")}
      {text("sourceVersion", "版本、分支或提交")}
      {text("investigation", "排查过程")}
      {text("failedAttempts", "失败尝试；未记录时明确写未记录")}
      {text("cause", "原因及结论等级")}
      {text("resolution", "解决办法")}
      {text("verificationResult", "验证结果")}
      {text("evidenceSources", "证据来源（每行一条）")}
      {text("applicability", "适用条件")}
      {text("limitations", "不适用条件与限制")}
      {text("openQuestions", "待确认信息；无则写无")}
    </form>
  </Dialog>;
}
