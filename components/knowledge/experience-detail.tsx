"use client";

import { Dialog } from "@/components/shared/dialog";
import { Button } from "@/components/ui/button";
import { isEngineeringExperience } from "@/services/engineering-experience-service";
import type { KnowledgeItem } from "@/types/knowledge";

export function ExperienceDetail({ item, version, onClose, onEdit }: {
  item: KnowledgeItem | null;
  version?: number;
  onClose: () => void;
  onEdit: (item: KnowledgeItem) => void;
}) {
  if (!item || !isEngineeringExperience(item)) return null;
  const detail = item.experience;
  const section = (title: string, value: string) => <section className="space-y-1">
    <h3 className="text-xs font-semibold text-slate-800">{title}</h3>
    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{value}</p>
  </section>;
  return <Dialog open title={item.title} onClose={onClose} size="lg"
    footer={<><Button variant="outline" onClick={onClose}>关闭</Button>
      <Button onClick={() => onEdit(item)}>编辑经验</Button></>}>
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded bg-blue-50 px-2 py-1 text-blue-800">项目：{detail.sourceProject}</span>
        <span className="rounded bg-slate-100 px-2 py-1">审核：{detail.reviewStatus}</span>
        <span className="rounded bg-amber-50 px-2 py-1 text-amber-900">证据：{detail.evidenceStatus}</span>
        {item.tags.map((tag) => <span key={tag} className="rounded bg-slate-100 px-2 py-1">#{tag}</span>)}
      </div>
      {section("现象", detail.phenomenon)}
      {section("环境与版本", `${detail.environment}\n\n${detail.sourceVersion}`)}
      {section("排查过程", detail.investigation)}
      {section("失败尝试", detail.failedAttempts)}
      {section("原因", detail.cause)}
      {section("解决办法", detail.resolution)}
      {section("验证结果", detail.verificationResult)}
      <section className="space-y-1"><h3 className="text-xs font-semibold text-slate-800">证据来源</h3>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          {detail.evidenceSources.map((source) => <li key={source} className="break-all">{source}</li>)}
        </ul></section>
      {section("适用条件", detail.applicability)}
      {section("不适用条件与限制", detail.limitations)}
      {section("待确认", detail.openQuestions)}
      <p className="break-all border-t pt-3 text-xs text-slate-500">记录 ID：{item.id} · 数据库版本：{version ?? "待读取"}
        {detail.sourceKey && <> · 来源标识：{detail.sourceKey}</>}
        {detail.sourceRevision && <> · 来源摘要：{detail.sourceRevision}</>}</p>
    </div>
  </Dialog>;
}
