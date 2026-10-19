"use client";
/* eslint-disable @next/next/no-img-element -- existing log attachments may be private data URLs */

import { useEffect, useState } from "react";
import { WorkLogDialog } from "@/components/engineering/work-log-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Dialog } from "@/components/shared/dialog";
import { Button } from "@/components/ui/button";
import { useWorkspaceData } from "@/hooks/use-workspace-data";
import { createWorkLog } from "@/services/engineering-service";
import type { WorkLog, WorkLogDraft } from "@/types/engineering-log";

export function EngineeringLogSection({ query, tag, projectId, initialTaskId, selectedId, openCreate, onSelect }: {
  query: string; tag: string; projectId: string; initialTaskId?: string; selectedId: string; openCreate: boolean; onSelect(id: string | null): void;
}) {
  const { data, dispatch } = useWorkspaceData();
  const [editing, setEditing] = useState<WorkLog | null>(null);
  const [formOpen, setFormOpen] = useState(openCreate);
  useEffect(() => { if (openCreate) setFormOpen(true); }, [openCreate]);
  const [deleting, setDeleting] = useState<WorkLog | null>(null);
  const selected = data.workLogs.find((item) => item.id === selectedId) ?? null;
  const normalized = query.trim().toLocaleLowerCase("zh-CN");
  const logs = data.workLogs.filter((item) => (!projectId || item.projectId === projectId) &&
    (!tag || item.tags.some((value) => value.toLocaleLowerCase("zh-CN").includes(tag.toLocaleLowerCase("zh-CN")))) &&
    (!normalized || [item.title, item.workContent, item.result, item.problems, item.nextPlan,
      ...item.tags].join(" ").toLocaleLowerCase("zh-CN").includes(normalized)))
    .sort((a, b) => b.date.localeCompare(a.date));
  const save = async (draft: WorkLogDraft, current: WorkLog | null) => {
    const next = current ? { ...current, ...draft, updatedAt: new Date().toISOString() } : createWorkLog(draft);
    await dispatch(current ? { type: "work-log/updated", workLog: next } : { type: "work-log/added", workLog: next });
    onSelect(next.id);
  };
  return <section className="space-y-3" aria-label="研发过程记录">
    <div className="flex items-center justify-between"><h2 className="font-semibold">研发过程记录</h2><Button size="sm" variant="outline" onClick={() => { setEditing(null); setFormOpen(true); }}>新增过程记录</Button></div>
    {logs.map((log) => <article key={log.id} className="rounded-lg border bg-white p-5 shadow-sm">
      <p className="text-xs text-slate-500">{log.date} · {data.projects.find((item) => item.id === log.projectId)?.name ?? "原项目"} · {log.resultStatus}</p>
      <h3 className="mt-2 font-semibold">{log.title}</h3><p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-slate-600">{log.workContent}</p>
      <div className="mt-3 flex flex-wrap gap-2">{log.tags.map((tag) => <span key={tag} className="rounded bg-slate-100 px-2 py-1 text-xs">#{tag}</span>)}</div>
      <div className="mt-4 flex gap-2"><Button size="sm" variant="outline" onClick={() => onSelect(log.id)}>查看</Button><Button size="sm" variant="ghost" onClick={() => { setEditing(log); setFormOpen(true); }}>编辑</Button><Button size="sm" variant="destructive" onClick={() => setDeleting(log)}>删除</Button></div>
    </article>)}
    <Dialog open={Boolean(selected)} title={selected?.title ?? "研发过程记录"} onClose={() => onSelect(null)} size="lg"
      footer={<><Button variant="outline" onClick={() => onSelect(null)}>关闭</Button>{selected && <Button onClick={() => { setEditing(selected); setFormOpen(true); onSelect(null); }}>编辑</Button>}</>}>
      {selected && <div className="space-y-3 whitespace-pre-wrap break-words text-sm leading-6">
        <p className="text-xs text-slate-500">{selected.date} · {selected.resultStatus} · {selected.durationMinutes} 分钟</p>
        <p>{selected.workContent}</p><p>结果：{selected.result}</p><p>问题：{selected.problems}</p><p>下一步：{selected.nextPlan}</p>
        {selected.attachments.length > 0 && <div>附件：{selected.attachments.map((url) => /^data:image\//.test(url) || /\.(png|jpe?g|webp)(\?|$)/i.test(url)
          ? <img key={url} src={url} alt="日志附件" className="mt-2 max-h-72 max-w-full object-contain" />
          : <p key={url} className="break-all">{url}</p>)}</div>}
        <p className="text-xs text-slate-500">项目 {selected.projectId} · 模块 {selected.moduleId ?? "无"} · 任务 {selected.taskId ?? "无"}</p>
      </div>}
    </Dialog>
    <WorkLogDialog open={formOpen} log={editing} data={data} initialProjectId={projectId} initialTaskId={initialTaskId}
      onClose={() => { setFormOpen(false); if (openCreate) onSelect(null); }} onSubmit={save} />
    <ConfirmDialog open={Boolean(deleting)} title="删除过程记录" description="存在关联测试、问题或附件时服务器会拒绝删除。" onCancel={() => setDeleting(null)}
      onConfirm={() => { if (!deleting) return; void dispatch({ type: "work-log/deleted", workLogId: deleting.id }).then(() => setDeleting(null)).catch((cause: unknown) => window.alert(cause instanceof Error ? cause.message : "删除失败。")); }} />
  </section>;
}
