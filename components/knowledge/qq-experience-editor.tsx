"use client";
/* eslint-disable @next/next/no-img-element -- cropped private screenshot data URLs are rendered directly */

import { useEffect, useState } from "react";
import { Dialog } from "@/components/shared/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { KnowledgeItem } from "@/types/knowledge";
import type { Project } from "@/types/project";

export interface QqDraft {
  title: string; body: string; sourceGroup: string; discussionDate: string; excerpt: string;
  screenshot: string; verification: "待验证" | "已实测" | "部分适用";
  supplement: string; applicability: string; tags: string; projectId: string;
}
const blank: QqDraft = { title: "", body: "", sourceGroup: "", discussionDate: "", excerpt: "", screenshot: "",
  verification: "待验证", supplement: "", applicability: "", tags: "", projectId: "" };

export function QqExperienceEditor({ open, item, projects, onClose, onSubmit }: {
  open: boolean; item: KnowledgeItem | null; projects: Project[]; onClose(): void;
  onSubmit(draft: QqDraft, current: KnowledgeItem | null): Promise<void>;
}) {
  const [form, setForm] = useState<QqDraft>(blank);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) {
    const qq = item?.experience?.qq;
    setForm(item ? { title: item.title, body: item.content, sourceGroup: qq?.sourceGroup ?? "",
      discussionDate: qq?.discussionDate ?? "", excerpt: qq?.excerpt ?? "", screenshot: qq?.screenshot ?? "",
      verification: qq?.verification ?? "待验证", supplement: qq?.supplement ?? "",
      applicability: item.experience?.applicability ?? "", tags: item.tags.join(", "), projectId: item.projectId ?? "" } : blank);
    setError("");
  } }, [item, open]);
  const set = <K extends keyof QqDraft>(key: K, value: QqDraft[K]) => setForm((current) => ({ ...current, [key]: value }));
  const chooseScreenshot = async (file?: File) => {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 8 * 1024 * 1024) {
      setError("截图需为 PNG、JPEG 或 WebP，原图不超过 8 MB。"); return;
    }
    try {
      const image = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      const ratio = Math.min(1, 640 / image.width, 640 / image.height);
      canvas.width = Math.round(image.width * ratio); canvas.height = Math.round(image.height * ratio);
      canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
      image.close();
      const output = canvas.toDataURL("image/webp", 0.55);
      if (output.length > 30_000) throw new Error("截图压缩后仍过大，请裁剪原图或改用文字摘录。");
      set("screenshot", output); setError("");
    } catch (cause: unknown) { setError(cause instanceof Error ? cause.message : "截图读取失败。"); }
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError("");
    try { await onSubmit(form, item); onClose(); }
    catch (cause: unknown) { setError(cause instanceof Error ? cause.message : "保存失败，请重试。"); }
    finally { setSaving(false); }
  };
  return <Dialog open={open} title={item ? "编辑 QQ 技术群经验" : "新增 QQ 技术群经验"} onClose={onClose} size="lg"
    footer={<><Button variant="outline" onClick={onClose}>取消</Button><Button type="submit" form="qq-experience-form" disabled={saving}>保存经验</Button></>}>
    <form id="qq-experience-form" onSubmit={submit} className="space-y-4 text-xs">
      {error && <p role="alert" className="rounded bg-rose-50 p-3 text-rose-700">{error}</p>}
      <label className="block">标题<Input value={form.title} required onChange={(event) => set("title", event.target.value)} /></label>
      <label className="block">正文（可直接粘贴 AI 整理结果）<Textarea className="min-h-44" value={form.body} required onChange={(event) => set("body", event.target.value)} /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>来源群或说明<Input value={form.sourceGroup} onChange={(event) => set("sourceGroup", event.target.value)} /></label>
        <label>原讨论日期<Input type="date" value={form.discussionDate} onChange={(event) => set("discussionDate", event.target.value)} /></label>
        <label>验证状态<Select value={form.verification} onChange={(event) => set("verification", event.target.value as QqDraft["verification"])}>{(["待验证", "已实测", "部分适用"] as const).map((status) => <option key={status}>{status}</option>)}</Select></label>
        <label>关联项目<Select value={form.projectId} onChange={(event) => set("projectId", event.target.value)}><option value="">不关联</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</Select></label>
        <label>技术标签（逗号分隔）<Input value={form.tags} onChange={(event) => set("tags", event.target.value)} /></label>
      </div>
      <label className="block">原文摘录<Textarea value={form.excerpt} onChange={(event) => set("excerpt", event.target.value)} /></label>
      <label className="block">原讨论截图（可选，压缩后保存）<Input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => {
        void chooseScreenshot(event.target.files?.[0]); event.target.value = "";
      }} /></label>
      {form.screenshot && <div><img src={form.screenshot} alt="原讨论截图预览" className="max-h-44 rounded border object-contain" /><Button type="button" variant="ghost" onClick={() => set("screenshot", "")}>移除截图</Button></div>}
      <label className="block">我的补充<Textarea value={form.supplement} onChange={(event) => set("supplement", event.target.value)} /></label>
      <label className="block">适用条件<Textarea value={form.applicability} onChange={(event) => set("applicability", event.target.value)} /></label>
    </form>
  </Dialog>;
}
