"use client";

import { useState } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { readRawBrowserSnapshot } from "@/repositories/migration/raw-browser-source";
import { prepareRawMigration } from "@/services/migration/preflight";
import { MIGRATION_COLLECTIONS, type MigrationPreview, type MigrationResult,
  type RawBrowserSnapshot } from "@/types/migration";

type LocalCheck = ReturnType<typeof prepareRawMigration>;

async function postMigration(path: "preview" | "execute", body: object): Promise<unknown> {
  const response = await fetch(`/api/private/migration/${path}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body), credentials: "same-origin",
  });
  const data: unknown = await response.json();
  if (!data || typeof data !== "object") throw new Error("服务器响应无效。");
  const record = data as Record<string, unknown>;
  if (!response.ok) throw new Error(typeof record.error === "string" ? record.error : "迁移请求失败。");
  return record;
}

export function BrowserMigrationTool() {
  const [raw, setRaw] = useState<RawBrowserSnapshot | null>(null);
  const [local, setLocal] = useState<LocalCheck | null>(null);
  const [preview, setPreview] = useState<MigrationPreview | null>(null);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [includeIds, setIncludeIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const read = () => {
    try {
      const snapshot = readRawBrowserSnapshot(window.localStorage);
      setRaw(snapshot);
      setLocal(prepareRawMigration(snapshot));
      setPreview(null); setResult(null); setIncludeIds([]); setError(null);
    } catch (cause: unknown) { setError(cause instanceof Error ? cause.message : "无法读取浏览器数据。"); }
  };
  const uploadPreview = async () => {
    if (!raw) return;
    setBusy(true); setError(null);
    try {
      const data = await postMigration("preview", { raw, includeIds }) as { preview: MigrationPreview };
      setPreview(data.preview); setResult(null);
    } catch (cause: unknown) { setError(cause instanceof Error ? cause.message : "预览失败。"); }
    finally { setBusy(false); }
  };
  const execute = async () => {
    if (!raw || !preview) return;
    if (!window.confirm("确认将预览中的可写记录迁入服务器？浏览器原始数据将保留。")) return;
    setBusy(true); setError(null);
    try {
      const data = await postMigration("execute", { raw, includeIds,
        previewDigest: preview.previewDigest }) as { result: MigrationResult };
      setResult(data.result);
    } catch (cause: unknown) { setError(cause instanceof Error ? cause.message : "执行失败；原始数据仍在浏览器。"); }
    finally { setBusy(false); }
  };
  const ambiguous = local?.entities.filter((item) => item.origin === "NEEDS_REVIEW" && !item.reasons.length) ?? [];
  const toggle = (key: string) => {
    setIncludeIds((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
    setPreview(null); setResult(null);
  };
  const counts = result?.counts ?? preview?.counts;
  return <div className="space-y-5">
    <PageHeader eyebrow="SERVER MIGRATION" title="浏览器数据迁移"
      description="先在本机检查，再主动上传预览并执行。旧 localStorage、备份入口和工作台现有数据源都会保留。" />
    <section className="rounded-lg border bg-white p-4 text-sm leading-6 text-slate-600">
      <p>原文只在点击“读取原始数据”后读取。点击“上传服务器预览”会发送这份原文，包括个人记录；请先在可信任的本地环境中确认。</p>
      <p>演示原样记录默认跳过；无法判断的记录需要勾选。异常关联和数据冲突会列在待处理清单，不会自动覆盖。</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={read} disabled={busy}>1. 读取原始数据并本机预检查</Button>
        <Button variant="outline" onClick={() => { void uploadPreview(); }} disabled={!local || busy || local.fatal}>2. 上传服务器预览</Button>
        <Button onClick={() => { void execute(); }} disabled={!preview?.canExecute || busy}>3. 执行并核对</Button>
      </div>
    </section>
    {error && <p role="alert" className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {busy && <p role="status" className="text-sm text-slate-500">正在处理迁移请求…</p>}
    {local && <section className="rounded-lg border bg-white p-4">
      <h2 className="font-semibold">本机预检查</h2>
      <p className="mt-2 text-sm text-slate-600">来源：{local.sourceKind}；记录：{local.entities.length}；问题：{local.issues.length}</p>
      {ambiguous.length > 0 && <div className="mt-4"><h3 className="text-sm font-semibold">需人工判断的演示 ID 修改记录</h3>
        <div className="mt-2 max-h-56 space-y-2 overflow-auto">{ambiguous.map((item) => {
          const key = `${item.collection}:${item.id}`;
          return <label key={key} className="flex items-start gap-2 break-all text-xs">
            <input type="checkbox" checked={includeIds.includes(key)} onChange={() => toggle(key)} />
            <span>{key} · 勾选后迁入；不勾选则留在待处理清单</span>
          </label>;
        })}</div>
      </div>}
    </section>}
    {counts && <section className="overflow-x-auto rounded-lg border bg-white p-4">
      <h2 className="font-semibold">{result ? "执行结果" : "服务器预览"}</h2>
      <table className="mt-3 w-full min-w-[620px] text-left text-xs">
        <thead><tr className="border-b"><th className="p-2">集合</th><th>来源</th><th>写入</th><th>跳过</th><th>冲突</th><th>待处理</th></tr></thead>
        <tbody>{MIGRATION_COLLECTIONS.map((name) => <tr key={name} className="border-b last:border-0">
          <td className="p-2 font-medium">{name}</td><td>{counts[name].source}</td><td>{counts[name].written}</td>
          <td>{counts[name].skipped}</td><td>{counts[name].conflict}</td><td>{counts[name].pending}</td>
        </tr>)}</tbody>
      </table>
      {result && <p className="mt-3 break-all text-xs">批次 {result.batchId} · {result.status} · 核对时间 {result.verifiedAt}</p>}
    </section>}
    {(result ?? preview ?? local)?.issues.length ? <section className="rounded-lg border bg-white p-4">
      <h2 className="font-semibold">来源、关联与冲突问题</h2>
      <ul className="mt-2 max-h-80 space-y-2 overflow-auto text-xs">{(result ?? preview ?? local)?.issues.map((item, index) =>
        <li key={`${item.collection}:${item.sourceId}:${index}`} className="break-all rounded bg-amber-50 p-2">
          {item.collection}:{item.sourceId} · {item.code} · {item.message}
        </li>)}</ul>
    </section> : null}
  </div>;
}
