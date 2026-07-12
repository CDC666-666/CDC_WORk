"use client";

import { useRef, useState } from "react";
import { DatabaseBackup, Download, FileJson, RotateCcw, Upload } from "lucide-react";

import { ActionToast, type ToastNotice } from "@/components/layout/action-toast";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Dialog } from "@/components/shared/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useWorkspaceData } from "@/hooks/use-workspace-data";
import { toLocalDateKey } from "@/lib/date";
import { createWorkspaceBackup, WORKSPACE_STORAGE_KEY } from "@/lib/storage/workspace-storage";
import { parseWorkspaceBackup } from "@/services/workspace-repository";
import type { WorkspaceBackup } from "@/types/workspace";

export function LocalDataSettings() {
  const workspace = useWorkspaceData();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingBackup, setPendingBackup] = useState<WorkspaceBackup | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [notice, setNotice] = useState<ToastNotice | null>(null);
  const show = (title: string, description: string) => setNotice({ id: Date.now(), title, description });

  const exportData = () => {
    const backup = createWorkspaceBackup(workspace.data);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `cdc-workspace-backup-${toLocalDateKey()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    show("数据已导出", "备份文件已生成，请妥善保管。 ");
  };

  const chooseImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { show("导入失败", "备份文件不能超过 5 MB。 "); return; }
    try {
      const backup = parseWorkspaceBackup(await file.text());
      setPendingBackup(backup);
    } catch (error: unknown) {
      show("导入失败", error instanceof Error ? error.message : "无法读取备份文件。 ");
    }
  };

  const confirmImport = () => {
    if (!pendingBackup) return;
    workspace.replaceWorkspaceData({
      ...pendingBackup.data,
      metadata: { ...pendingBackup.data.metadata, updatedAt: new Date().toISOString() },
    });
    setPendingBackup(null);
    show("数据导入成功", "任务、学习计划、学习记录和阅读条目已全部更新。 ");
  };

  const statistics = [
    ["Schema version", workspace.data.metadata.schemaVersion],
    ["最后更新时间", new Date(workspace.data.metadata.updatedAt).toLocaleString("zh-CN")],
    ["任务数量", workspace.data.tasks.length],
    ["学习计划数量", workspace.data.studyPlans.length],
    ["阅读条目数量", workspace.data.readingItems.length],
    ["项目 / 模块", `${workspace.data.projects.length} / ${workspace.data.projectModules.length}`],
    ["日志 / 测试", `${workspace.data.workLogs.length} / ${workspace.data.testRecords.length}`],
    ["问题 / 知识", `${workspace.data.technicalIssues.length} / ${workspace.data.knowledgeItems.length}`],
    ["技能 / 证据", `${workspace.data.skills.length} / ${workspace.data.skillEvidence.length}`],
    ["报告 / 简历素材", `${workspace.data.reports.length} / ${workspace.data.resumeMaterials.length}`],
    ["日程 / 收支", `${workspace.data.calendarEvents.length} / ${workspace.data.financeTransactions.length}`],
  ];

  return <div className="space-y-5 lg:space-y-6">
    <PageHeader eyebrow="LOCAL DATA" title="设置" description="管理 CDC AI Workspace 的本地数据备份、导入与演示数据恢复。" />
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="本地数据统计">{statistics.map(([label, value]) => <article key={label} className="rounded-lg border border-border bg-white p-4 shadow-sm"><p className="text-[11px] text-slate-500">{label}</p><p className="mt-1 break-words text-sm font-semibold text-slate-950">{value}</p></article>)}</section>
    <section className="rounded-lg border border-border bg-white shadow-sm"><header className="border-b border-border p-5"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-md bg-blue-50 text-blue-600"><DatabaseBackup className="h-5 w-5" /></div><div><h2 className="text-base font-semibold text-slate-900">本地数据管理</h2><p className="mt-1 text-xs text-slate-500">当前数据保存在浏览器 localStorage，不会上传到服务器。</p></div></div></header><div className="grid gap-4 p-5 lg:grid-cols-3">
      <article className="rounded-lg border border-slate-200 p-4"><Download className="h-5 w-5 text-blue-600" /><h3 className="mt-3 text-sm font-semibold text-slate-900">导出数据</h3><p className="mt-2 text-xs leading-5 text-slate-500">下载经过版本标记的 JSON 备份，包含任务、学习计划、学习记录和书架。</p><Button className="mt-4" variant="outline" onClick={exportData}><Download />导出 JSON</Button></article>
      <article className="rounded-lg border border-slate-200 p-4"><Upload className="h-5 w-5 text-emerald-600" /><h3 className="mt-3 text-sm font-semibold text-slate-900">导入数据</h3><p className="mt-2 text-xs leading-5 text-slate-500">文件会先经过结构验证和数量预览，确认后才覆盖当前数据。</p><input ref={inputRef} type="file" accept="application/json,.json" className="sr-only" onChange={chooseImport} /><Button className="mt-4" variant="outline" onClick={() => inputRef.current?.click()}><FileJson />选择备份</Button></article>
      <article className="rounded-lg border border-rose-200 bg-rose-50/30 p-4"><RotateCcw className="h-5 w-5 text-rose-600" /><h3 className="mt-3 text-sm font-semibold text-slate-900">恢复演示数据</h3><p className="mt-2 text-xs leading-5 text-slate-500">清除 Workspace v2 与旧任务状态，恢复 Sprint 2 初始化数据。</p><Button className="mt-4" variant="destructive" onClick={() => setResetOpen(true)}><RotateCcw />恢复演示数据</Button></article>
    </div></section>
    <section className="rounded-lg border border-border bg-slate-50 p-4 text-xs leading-6 text-slate-500"><p>存储键：<code className="rounded bg-white px-1.5 py-1 text-slate-700">{WORKSPACE_STORAGE_KEY}</code></p><p>导入文件仅作为 JSON 文本解析，不执行其中任何代码；不符合类型守卫的数据不会写入。</p></section>
    <Dialog open={Boolean(pendingBackup)} title="确认导入本地数据" description="导入会覆盖当前 Workspace 数据，请先确认数量。" onClose={() => setPendingBackup(null)} footer={<><Button variant="outline" onClick={() => setPendingBackup(null)}>取消</Button><Button onClick={confirmImport}>确认覆盖并导入</Button></>}><div className="grid grid-cols-3 gap-3">{[["任务", pendingBackup?.data.tasks.length ?? 0], ["学习计划", pendingBackup?.data.studyPlans.length ?? 0], ["书籍", pendingBackup?.data.readingItems.length ?? 0]].map(([label, value]) => <div key={label} className="rounded-lg bg-slate-50 p-4 text-center"><p className="text-xl font-semibold text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-500">{label}</p></div>)}</div></Dialog>
    <ConfirmDialog open={resetOpen} title="恢复演示数据" description="这会覆盖当前所有任务、学习计划、学习记录和阅读数据。" confirmLabel="确认恢复" onCancel={() => setResetOpen(false)} onConfirm={() => { workspace.restoreDemoData(); setResetOpen(false); show("演示数据已恢复", "统一 Workspace 数据和旧任务状态已重置。 "); }} />
    <ActionToast notice={notice} onDismiss={() => setNotice(null)} />
  </div>;
}

