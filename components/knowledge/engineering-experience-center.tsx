"use client";

import { useMemo, useState } from "react";
import { Check, Plus } from "lucide-react";
import { ActionToast, type ToastNotice } from "@/components/layout/action-toast";
import { ExperienceDetail } from "@/components/knowledge/experience-detail";
import { ExperienceEditor } from "@/components/knowledge/experience-editor";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useWorkspaceData } from "@/hooks/use-workspace-data";
import { createExperienceKnowledge, evidenceStatuses, filterExperiences,
  isEngineeringExperience, withExperienceReviewStatus, type ExperienceDraft } from "@/services/engineering-experience-service";
import type { ExperienceEvidenceStatus, KnowledgeItem } from "@/types/knowledge";

export function EngineeringExperienceCenter({ initialRecordId }: { initialRecordId?: string }) {
  const { data, dispatch, snapshot } = useWorkspaceData();
  const [query, setQuery] = useState("");
  const [project, setProject] = useState("");
  const [tag, setTag] = useState("");
  const [evidenceStatus, setEvidenceStatus] = useState<ExperienceEvidenceStatus | "全部">("全部");
  const [selectedId, setSelectedId] = useState(initialRecordId ?? "");
  const [editing, setEditing] = useState<KnowledgeItem | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [notice, setNotice] = useState<ToastNotice | null>(null);
  const projects = useMemo(() => [...new Set(data.knowledgeItems.filter(isEngineeringExperience)
    .map((item) => item.experience.sourceProject))].sort(), [data.knowledgeItems]);
  const items = useMemo(() => filterExperiences(data.knowledgeItems, { query, project, tag, evidenceStatus }),
    [data.knowledgeItems, evidenceStatus, project, query, tag]);
  const selected = data.knowledgeItems.find((item) => item.id === selectedId) ?? null;

  const save = async (draft: ExperienceDraft, current: KnowledgeItem | null) => {
    const item = createExperienceKnowledge(draft, current ?? undefined);
    await dispatch(current ? { type: "knowledge/updated", item } : { type: "knowledge/added", item });
    setSelectedId(item.id);
    setNotice({ id: Date.now(), title: "经验已保存", description: "数据已写入私人服务器知识库。" });
  };
  const review = async (item: KnowledgeItem) => {
    try {
      await dispatch({ type: "knowledge/updated", item: withExperienceReviewStatus(item, "已审核") });
      setNotice({ id: Date.now(), title: "审核状态已更新", description: "证据状态保持原值。" });
    } catch (cause: unknown) {
      setNotice({ id: Date.now(), title: "审核保存失败", description: cause instanceof Error ? cause.message : "请重试。" });
    }
  };

  return <div className="space-y-5">
    <PageHeader eyebrow="ENGINEERING EXPERIENCE" title="工程经验" description="从调试记录中提炼可复用结论。审核状态与证据状态独立；引用经验前先核对版本和适用条件。"
      actions={<Button onClick={() => { setEditing(null); setEditorOpen(true); }}><Plus />新增经验</Button>} />
    <section className="grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-2 xl:grid-cols-4">
      <Input aria-label="搜索工程经验" placeholder="搜索标题、现象、排查和结论" value={query}
        onChange={(event) => setQuery(event.target.value)} />
      <Select aria-label="来源项目筛选" value={project} onChange={(event) => setProject(event.target.value)}>
        <option value="">全部来源项目</option>{projects.map((value) => <option key={value} value={value}>{value}</option>)}
      </Select>
      <Input aria-label="标签筛选" placeholder="筛选标签" value={tag} onChange={(event) => setTag(event.target.value)} />
      <Select aria-label="证据状态筛选" value={evidenceStatus}
        onChange={(event) => setEvidenceStatus(event.target.value as ExperienceEvidenceStatus | "全部")}>
        <option>全部</option>{evidenceStatuses.map((value) => <option key={value}>{value}</option>)}
      </Select>
    </section>
    {items.length ? <section className="grid gap-4 xl:grid-cols-2">{items.map((item) => {
      if (!isEngineeringExperience(item)) return null;
      return <article key={item.id} className="min-w-0 rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap gap-2 text-xs"><span className="rounded bg-blue-50 px-2 py-1 text-blue-800">{item.experience.sourceProject}</span>
          <span className="rounded bg-slate-100 px-2 py-1">审核：{item.experience.reviewStatus}</span>
          <span className="rounded bg-amber-50 px-2 py-1 text-amber-900">证据：{item.experience.evidenceStatus}</span></div>
        <h2 className="mt-3 text-base font-semibold text-slate-900">{item.title}</h2>
        <p className="mt-2 line-clamp-2 text-sm text-slate-600">{item.experience.phenomenon}</p>
        <div className="mt-3 flex flex-wrap gap-1">{item.tags.map((value) =>
          <span key={value} className="rounded bg-slate-100 px-2 py-0.5 text-xs">#{value}</span>)}</div>
        <p className="mt-3 line-clamp-2 text-xs text-slate-500">适用：{item.experience.applicability}</p>
        <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">
          <Button size="sm" variant="outline" onClick={() => setSelectedId(item.id)}>查看详情</Button>
          <Button size="sm" variant="ghost" onClick={() => { setEditing(item); setEditorOpen(true); }}>编辑</Button>
          {item.experience.reviewStatus === "待审核" && <Button size="sm" variant="ghost"
            onClick={() => { void review(item); }}><Check />标记已审核</Button>}
        </div>
      </article>;
    })}</section> : <EmptyState title={data.knowledgeItems.some(isEngineeringExperience) ? "没有符合条件的经验" : "还没有工程经验"}
      description="可从调试记录提炼经验，或运行限定范围的共享案例导入工具。"
      actionLabel="新增经验" onAction={() => { setEditing(null); setEditorOpen(true); }} />}
    <ExperienceDetail item={selected} version={selected ? snapshot.versions[`knowledge:${selected.id}`] : undefined}
      onClose={() => setSelectedId("")} onEdit={(item) => { setSelectedId(""); setEditing(item); setEditorOpen(true); }} />
    <ExperienceEditor open={editorOpen} item={editing} projects={data.projects}
      onClose={() => setEditorOpen(false)} onSubmit={save} />
    <ActionToast notice={notice} onDismiss={() => setNotice(null)} />
  </div>;
}
