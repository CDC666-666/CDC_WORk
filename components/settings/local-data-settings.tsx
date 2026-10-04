"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { DatabaseBackup, Download, FileJson, RotateCcw, Upload } from "lucide-react";

import { ActionToast, type ToastNotice } from "@/components/layout/action-toast";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Dialog } from "@/components/shared/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useWorkspaceData } from "@/hooks/use-workspace-data";
import { useAcademic } from "@/hooks/use-academic";
import { toLocalDateKey } from "@/lib/date";
import { assertDomainReferences } from "@/lib/storage/domain-relations";
import { localWorkspaceRepository } from "@/repositories/workspace-repository";
import { parseWorkspaceBackup, workspaceDataService, WORKSPACE_STORAGE_KEY,
  type WorkspaceImportPreview } from "@/services/workspace-data-service";
import { WORKSPACE_DOMAIN_SCHEMA_VERSION } from "@/types/workspace";

export function LocalDataSettings() {
  const workspace = useWorkspaceData();
  const academic = useAcademic();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingBackup, setPendingBackup] = useState<WorkspaceImportPreview | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [notice, setNotice] = useState<ToastNotice | null>(null);
  const show = (title: string, description: string) => setNotice({ id: Date.now(), title, description });

  const downloadJson = (backup: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const exportData = async () => {
    try {
      const data = await localWorkspaceRepository.readPersistedDomain();
      assertDomainReferences(data);
      const backup = { app: "CDC AI Workspace", schemaVersion: 4, exportedAt: new Date().toISOString(), data };
      downloadJson(backup, `cdc-workspace-backup-${toLocalDateKey()}.json`);
      show("旧浏览器数据已导出", "只读导出旧 v4 记录；服务器数据未改动。 ");
    } catch (error: unknown) {
      show("导出失败", error instanceof Error ? error.message : "无法生成备份文件。");
    }
  };

  const exportRecovery = async () => {
    try {
      const backup = await workspaceDataService.createRecoveryBackup();
      downloadJson(backup, `cdc-workspace-recovery-${toLocalDateKey()}.json`);
      show("恢复备份已导出", backup.recovery.issues.length
        ? `完整记录已保留，并标出 ${backup.recovery.issues.length} 处失效关联。修复后才能正常导入。`
        : "完整持久化记录已导出；此恢复文件不能直接按普通备份导入。");
    } catch (error: unknown) {
      show("恢复备份导出失败", error instanceof Error ? error.message : "无法读取持久化 v4 数据。");
    }
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

  const confirmImport = async () => {
    if (!pendingBackup) return;
    try {
      await workspaceDataService.importBackup(pendingBackup);
      setPendingBackup(null);
      show("旧浏览器数据已导入", "仅更新旧浏览器存储；请到迁移页预检查后再写入服务器。 ");
    } catch (error: unknown) {
      show("导入失败", error instanceof Error ? error.message : "请检查浏览器存储后重试。");
    }
  };

  const statistics = [
    ["Schema version", WORKSPACE_DOMAIN_SCHEMA_VERSION],
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
    ["学期 / 课程 / 作业", `${academic.state.semesters.length} / ${academic.state.courses.length} / ${academic.state.assignments.length}`],
  ];

  return <div className="space-y-5 lg:space-y-6">
    <PageHeader eyebrow="SERVER DATA" title="设置" description="日常业务数据从服务器读取；旧浏览器备份工具保留用于迁移和恢复。" />
    <section className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm"><h2 className="font-semibold text-slate-900">旧数据迁移</h2><p className="mt-1 text-slate-600">服务器中的记录与浏览器旧数据分开。迁移前，旧键不会自动上传或清理。</p><Link href="/migration" className="mt-2 inline-block font-medium text-blue-700 underline">打开迁移工具</Link></section>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="服务器数据统计">{statistics.map(([label, value]) => <article key={label} className="rounded-lg border border-border bg-white p-4 shadow-sm"><p className="text-[11px] text-slate-500">{label}</p><p className="mt-1 break-words text-sm font-semibold text-slate-950">{value}</p></article>)}</section>
    <section className="rounded-lg border border-border bg-white shadow-sm"><header className="border-b border-border p-5"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-md bg-blue-50 text-blue-600"><DatabaseBackup className="h-5 w-5" /></div><div><h2 className="text-base font-semibold text-slate-900">旧浏览器数据管理</h2><p className="mt-1 text-xs text-slate-500">以下操作仅针对旧 localStorage，不改变服务器业务记录。</p></div></div></header><div className="grid gap-4 p-5 lg:grid-cols-3">
      <article className="rounded-lg border border-slate-200 p-4"><Download className="h-5 w-5 text-blue-600" /><h3 className="mt-3 text-sm font-semibold text-slate-900">导出数据</h3><p className="mt-2 text-xs leading-5 text-slate-500">下载经过版本标记的完整 JSON 备份。</p><div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" disabled={!workspace.isHydrated} onClick={exportData}><Download />导出 JSON</Button><Button variant="outline" disabled={!workspace.isHydrated} onClick={exportRecovery}><DatabaseBackup />导出恢复备份</Button></div><p className="mt-2 text-xs leading-5 text-slate-500">恢复备份只读地复制已保存数据，列出失效关联；需先修复后才能正常导入。</p></article>
      <article className="rounded-lg border border-slate-200 p-4"><Upload className="h-5 w-5 text-emerald-600" /><h3 className="mt-3 text-sm font-semibold text-slate-900">导入旧数据</h3><p className="mt-2 text-xs leading-5 text-slate-500">确认后只覆盖旧浏览器存储；服务器数据仍需在迁移页预览并执行。</p><input ref={inputRef} type="file" accept="application/json,.json" className="sr-only" onChange={chooseImport} /><Button className="mt-4" variant="outline" disabled={!workspace.isHydrated} onClick={() => inputRef.current?.click()}><FileJson />选择备份</Button></article>
      <article className="rounded-lg border border-rose-200 bg-rose-50/30 p-4"><RotateCcw className="h-5 w-5 text-rose-600" /><h3 className="mt-3 text-sm font-semibold text-slate-900">恢复旧演示数据</h3><p className="mt-2 text-xs leading-5 text-slate-500">仅重置旧浏览器存储，不影响 PostgreSQL；请先导出旧数据。</p><Button className="mt-4" variant="destructive" disabled={!workspace.isHydrated} onClick={() => setResetOpen(true)}><RotateCcw />恢复演示数据</Button></article>
    </div></section>
    <section className="rounded-lg border border-border bg-slate-50 p-4 text-xs leading-6 text-slate-500"><p>存储键：<code className="rounded bg-white px-1.5 py-1 text-slate-700">{WORKSPACE_STORAGE_KEY}</code></p><p>导入文件仅作为 JSON 文本解析，不执行其中任何代码；不符合类型守卫的数据不会写入。</p></section>
    <Dialog open={Boolean(pendingBackup)} title="确认导入旧浏览器数据" description="只覆盖旧 localStorage；服务器业务记录不变。" onClose={() => setPendingBackup(null)} footer={<><Button variant="outline" onClick={() => setPendingBackup(null)}>取消</Button><Button onClick={confirmImport}>确认覆盖旧数据</Button></>}><div className="grid grid-cols-3 gap-3">{[["任务", pendingBackup?.data.tasks.length ?? 0], ["学习计划", pendingBackup?.data.studyPlans.length ?? 0], ["书籍", pendingBackup?.data.readingItems.length ?? 0]].map(([label, value]) => <div key={label} className="rounded-lg bg-slate-50 p-4 text-center"><p className="text-xl font-semibold text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-500">{label}</p></div>)}</div></Dialog>
    <ConfirmDialog open={resetOpen} title="恢复旧演示数据" description="这只会覆盖旧浏览器数据，不影响服务器。建议先导出旧备份。" confirmLabel="确认恢复" onCancel={() => setResetOpen(false)} onConfirm={() => { void workspaceDataService.reset().then(() => { setResetOpen(false); show("旧演示数据已恢复", "服务器数据没有改变。 "); }).catch((cause: unknown) => { show("恢复失败", cause instanceof Error ? cause.message : "请重试。 "); }); }} />
    <ActionToast notice={notice} onDismiss={() => setNotice(null)} />
  </div>;
}

