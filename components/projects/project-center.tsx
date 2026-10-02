"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Edit3, Grid2X2, List, Plus, Trash2 } from "lucide-react";
import { ActionToast, type ToastNotice } from "@/components/layout/action-toast";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { useWorkspaceData } from "@/hooks/use-workspace-data";
import { cn } from "@/lib/utils";
import { createProject, getProjectImpact, projectDomainService, updateProject } from "@/services/project-service";
import { workspaceDataService } from "@/services/workspace-data-service";
import type { Project, ProjectCategory, ProjectDraft, ProjectStatus } from "@/types/project";

export function ProjectCenter({ openCreate = false }: { openCreate?: boolean }) {
  const { data, dispatch } = useWorkspaceData();
  const [query, setQuery] = useState(""); const [category, setCategory] = useState<ProjectCategory | "全部">("全部"); const [status, setStatus] = useState<ProjectStatus | "全部">("全部"); const [view, setView] = useState<"card" | "list">("card");
  const [editing, setEditing] = useState<Project | null>(null); const [formOpen, setFormOpen] = useState(openCreate); const [deleting, setDeleting] = useState<Project | null>(null); const [notice, setNotice] = useState<ToastNotice | null>(null);
  const projects = useMemo(() => data.projects.filter((project) => (!query || `${project.name} ${project.code} ${project.description}`.toLowerCase().includes(query.toLowerCase())) && (category === "全部" || project.category === category) && (status === "全部" || project.status === status)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [category, data.projects, query, status]);
  const save = (draft: ProjectDraft, current: Project | null) => { if (current) dispatch({ type: "project/updated", project: updateProject({ ...current, ...draft }) }); else dispatch({ type: "project/added", project: createProject(draft) }); setNotice({ id: Date.now(), title: current ? "项目已更新" : "项目已创建", description: "项目数据已同步到统一 Workspace。" }); };
  const impact = deleting ? getProjectImpact(data, deleting.id) : null;
  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      if (!(await workspaceDataService.save(data))) throw new Error("本地数据保存失败，请重试。");
      await projectDomainService.delete(deleting.id);
      dispatch({ type: "project/deleted", projectId: deleting.id });
      setNotice({ id: Date.now(), title: "项目已删除", description: "项目删除已保存。" });
    } catch (error: unknown) {
      setNotice({ id: Date.now(), title: "无法删除项目", description: error instanceof Error ? error.message : "请稍后重试。" });
    } finally {
      setDeleting(null);
    }
  };
  return <div className="space-y-5 lg:space-y-6"><PageHeader eyebrow="PROJECT PORTFOLIO" title="我的项目" description="项目是任务、工程记录、知识成果和成长证据的主线。" actions={<Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus />新增项目</Button>} />
    <section className="grid gap-3 rounded-lg border border-border bg-white p-4 shadow-sm md:grid-cols-[1fr_160px_160px_auto]"><Input aria-label="搜索项目" placeholder="搜索项目名称、代码或描述" value={query} onChange={(e) => setQuery(e.target.value)} /><Select aria-label="项目类别" value={category} onChange={(e) => setCategory(e.target.value as ProjectCategory | "全部")}><option>全部</option>{(["比赛", "课程", "科研", "个人", "创业"] as ProjectCategory[]).map((item) => <option key={item}>{item}</option>)}</Select><Select aria-label="项目状态" value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus | "全部")}><option>全部</option>{(["规划中", "进行中", "已暂停", "已完成", "已归档"] as ProjectStatus[]).map((item) => <option key={item}>{item}</option>)}</Select><div className="flex rounded-md border border-slate-200 p-1"><button type="button" aria-label="项目卡片视图" onClick={() => setView("card")} className={cn("grid h-8 w-8 place-items-center rounded", view === "card" && "bg-blue-50 text-blue-700")}><Grid2X2 className="h-4 w-4" /></button><button type="button" aria-label="项目列表视图" onClick={() => setView("list")} className={cn("grid h-8 w-8 place-items-center rounded", view === "list" && "bg-blue-50 text-blue-700")}><List className="h-4 w-4" /></button></div></section>
    {projects.length ? <section className={cn("grid gap-4", view === "card" ? "xl:grid-cols-2" : "grid-cols-1")}>{projects.map((project) => { const counts = getProjectImpact(data, project.id); return <article key={project.id} className="rounded-lg border border-border bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-4 sm:flex-row"><div className="min-w-0"><div className="flex flex-wrap gap-2"><span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] text-blue-700">{project.category}</span><span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">{project.status}</span><span className="text-[10px] text-slate-400">{project.code}</span></div><h2 className="mt-3 text-lg font-semibold text-slate-950">{project.name}</h2><p className="mt-2 text-xs leading-5 text-slate-500">{project.description}</p></div><div className="w-full sm:w-36"><p className="text-right text-xl font-semibold text-blue-700">{project.progress}%</p><Progress value={project.progress} className="mt-2 h-2 bg-slate-100" /></div></div><div className="mt-4 grid grid-cols-4 gap-2 border-y border-border py-3 text-center text-[10px] text-slate-500"><span>{counts.tasks}<b className="block font-normal">任务</b></span><span>{counts.logs}<b className="block font-normal">日志</b></span><span>{counts.issues}<b className="block font-normal">问题</b></span><span>{counts.milestones}<b className="block font-normal">里程碑</b></span></div><div className="mt-4 flex flex-wrap gap-2"><Button asChild size="sm"><Link href={`/projects/${project.id}`}>查看详情</Link></Button><Button size="sm" variant="ghost" onClick={() => { setEditing(project); setFormOpen(true); }}><Edit3 />编辑</Button><Button size="sm" variant="destructive" onClick={() => setDeleting(project)}><Trash2 />删除</Button></div></article>; })}</section> : <EmptyState title={data.projects.length ? "没有符合筛选的项目" : "还没有项目"} description="创建项目后，任务、日志、问题和知识都可以沿项目主线关联。" actionLabel="新增项目" onAction={() => { setEditing(null); setFormOpen(true); }} />}
    <ProjectFormDialog open={formOpen} project={editing} onClose={() => setFormOpen(false)} onSubmit={save} />
    <ConfirmDialog open={Boolean(deleting)} title="删除项目" description={impact ? `关联数据：${impact.tasks} 个任务、${impact.logs} 条日志、${impact.tests} 条测试、${impact.issues} 个问题、${impact.knowledge} 条知识、${impact.modules} 个模块、${impact.milestones} 个里程碑。存在关联记录时请先处理，系统会拒绝删除并保留记录。` : "确认删除该项目？存在关联记录时请先处理。"} confirmLabel="确认删除" onCancel={() => setDeleting(null)} onConfirm={() => { void confirmDelete(); }} />
    <ActionToast notice={notice} onDismiss={() => setNotice(null)} /></div>;
}
