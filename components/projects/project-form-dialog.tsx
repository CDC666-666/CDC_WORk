"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/components/shared/dialog";
import { FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { localDateKeyWithOffset, toLocalDateKey } from "@/lib/date";
import type { Project, ProjectCategory, ProjectDraft, ProjectStatus } from "@/types/project";

interface Props { open: boolean; project: Project | null; onClose: () => void; onSubmit: (draft: ProjectDraft, current: Project | null) => Promise<unknown> | void; }

function stateFrom(project: Project | null) {
  return project ? { ...project, objectives: project.objectives.join("\n"), responsibilities: project.responsibilities.join("\n"), techStack: project.techStack.join(", ") } : {
    name: "", code: "", category: "个人" as ProjectCategory, role: "负责人", description: "", status: "规划中" as ProjectStatus,
    progress: 0, startDate: toLocalDateKey(), endDate: localDateKeyWithOffset(new Date(), 90), objectives: "", responsibilities: "", techStack: "", repositoryUrl: "", coverStyle: "blue" as Project["coverStyle"],
  };
}

export function ProjectFormDialog({ open, project, onClose, onSubmit }: Props) {
  const [form, setForm] = useState(() => stateFrom(project));
  const [error, setError] = useState("");
  useEffect(() => { if (open) { setForm(stateFrom(project)); setError(""); } }, [open, project]);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim() || !form.code.trim()) { setError("项目名称和项目代码不能为空。"); return; }
    try {
      await onSubmit({ ...form, name: form.name.trim(), code: form.code.trim().toUpperCase(), description: form.description.trim(), progress: Number(form.progress), objectives: form.objectives.split("\n").map((item) => item.trim()).filter(Boolean), responsibilities: form.responsibilities.split("\n").map((item) => item.trim()).filter(Boolean), techStack: form.techStack.split(/[,，]/).map((item) => item.trim()).filter(Boolean) }, project);
      onClose();
    } catch (cause: unknown) { setError(cause instanceof Error ? cause.message : "服务器保存失败。"); }
  };
  return <Dialog open={open} title={project ? "编辑项目" : "新增项目"} description="项目是任务、日志、测试、知识和输出的统一数据源。" onClose={onClose} size="lg" footer={<><Button variant="outline" onClick={onClose}>取消</Button><Button type="submit" form="project-form">{project ? "保存修改" : "创建项目"}</Button></>}>
    <form id="project-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <FormField label="项目名称" htmlFor="project-name" error={error}><Input id="project-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus /></FormField><FormField label="项目代码" htmlFor="project-code"><Input id="project-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></FormField>
      <FormField label="类别" htmlFor="project-category"><Select id="project-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ProjectCategory })}>{(["比赛", "课程", "科研", "个人", "创业"] as ProjectCategory[]).map((item) => <option key={item}>{item}</option>)}</Select></FormField><FormField label="状态" htmlFor="project-status"><Select id="project-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}>{(["规划中", "进行中", "已暂停", "已完成", "已归档"] as ProjectStatus[]).map((item) => <option key={item}>{item}</option>)}</Select></FormField>
      <FormField label="角色" htmlFor="project-role"><Input id="project-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} /></FormField><FormField label="进度（0-100）" htmlFor="project-progress"><Input id="project-progress" type="number" min="0" max="100" value={form.progress} onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })} /></FormField>
      <FormField label="开始日期" htmlFor="project-start"><Input id="project-start" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></FormField><FormField label="结束日期" htmlFor="project-end"><Input id="project-end" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></FormField>
      <div className="sm:col-span-2"><FormField label="项目描述" htmlFor="project-description"><Textarea id="project-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FormField></div>
      <FormField label="项目目标" htmlFor="project-objectives" hint="每行一个目标"><Textarea id="project-objectives" value={form.objectives} onChange={(e) => setForm({ ...form, objectives: e.target.value })} /></FormField><FormField label="个人职责" htmlFor="project-responsibilities" hint="每行一项职责"><Textarea id="project-responsibilities" value={form.responsibilities} onChange={(e) => setForm({ ...form, responsibilities: e.target.value })} /></FormField>
      <FormField label="技术栈" htmlFor="project-stack"><Input id="project-stack" value={form.techStack} onChange={(e) => setForm({ ...form, techStack: e.target.value })} placeholder="STM32, CAN, C++" /></FormField><FormField label="仓库链接（仅文本链接）" htmlFor="project-repo"><Input id="project-repo" value={form.repositoryUrl} onChange={(e) => setForm({ ...form, repositoryUrl: e.target.value })} /></FormField>
    </form>
  </Dialog>;
}

