"use client";
/* eslint-disable @next/next/no-img-element -- private screenshot data URLs are rendered directly */

import { useEffect, useMemo, useState } from "react";
import { Check, Plus } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ActionToast, type ToastNotice } from "@/components/layout/action-toast";
import { ExperienceDetail } from "@/components/knowledge/experience-detail";
import { ExperienceEditor } from "@/components/knowledge/experience-editor";
import { EngineeringLogSection } from "@/components/knowledge/engineering-log-section";
import { QqExperienceEditor, type QqDraft } from "@/components/knowledge/qq-experience-editor";
import { Dialog } from "@/components/shared/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useWorkspaceData } from "@/hooks/use-workspace-data";
import { createExperienceKnowledge, createQqExperienceKnowledge, evidenceStatuses, filterExperiences,
  isEngineeringExperience, withExperienceReviewStatus, type ExperienceDraft } from "@/services/engineering-experience-service";
import type { ExperienceEvidenceStatus, KnowledgeItem } from "@/types/knowledge";

export function EngineeringExperienceCenter() {
  const { data, dispatch, snapshot } = useWorkspaceData();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("record") ?? "";
  const routeProjectId = searchParams.get("projectId") ?? "";
  const [query, setQuery] = useState("");
  const [project, setProject] = useState(routeProjectId);
  useEffect(() => { setProject(routeProjectId); }, [routeProjectId]);
  const [tag, setTag] = useState("");
  const [evidenceStatus, setEvidenceStatus] = useState<ExperienceEvidenceStatus | "全部">("全部");
  const [qqStatus, setQqStatus] = useState<"全部" | "待验证" | "已实测" | "部分适用">("全部");
  const [editing, setEditing] = useState<KnowledgeItem | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [qqEditing, setQqEditing] = useState<KnowledgeItem | null>(null);
  const [qqOpen, setQqOpen] = useState(false);
  const [tab, setTab] = useState<"all" | "experience" | "process" | "qq">("all");
  const [notice, setNotice] = useState<ToastNotice | null>(null);
  const projects = useMemo(() => [...new Set(data.knowledgeItems.filter(isEngineeringExperience)
    .map((item) => item.experience.sourceProject))].sort(), [data.knowledgeItems]);
  const items = useMemo(() => filterExperiences(data.knowledgeItems, { query, project, tag, evidenceStatus })
    .filter((item) => !data.projects.some((candidate) => candidate.id === project) || item.projectId === project)
    .filter((item) => tab === "all" || tab === "experience" && !item.experience?.qq || tab === "qq" && Boolean(item.experience?.qq))
    .filter((item) => tab !== "qq" || qqStatus === "全部" || item.experience?.qq?.verification === qqStatus)
    .filter((item) => !item.sourceId || !data.workLogs.some((log) => log.id === item.sourceId)),
    [data.knowledgeItems, data.projects, data.workLogs, evidenceStatus, project, query, tag, tab, qqStatus]);
  const selected = data.knowledgeItems.find((item) => item.id === selectedId && isEngineeringExperience(item)) ?? null;
  const selectedQq = selected?.experience?.qq ? selected : null;

  const selectRecord = (id: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set("record", id);
    else params.delete("record");
    params.delete("create");
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  const save = async (draft: ExperienceDraft, current: KnowledgeItem | null) => {
    const item = createExperienceKnowledge(draft, current ?? undefined);
    await dispatch(current ? { type: "knowledge/updated", item } : { type: "knowledge/added", item });
    selectRecord(item.id);
    setNotice({ id: Date.now(), title: "经验已保存", description: "数据已写入私人服务器知识库。" });
  };
  const saveQq = async (draft: QqDraft, current: KnowledgeItem | null) => {
    const item = createQqExperienceKnowledge(draft, current ?? undefined);
    await dispatch(current ? { type: "knowledge/updated", item } : { type: "knowledge/added", item });
    selectRecord(item.id);
    setNotice({ id: Date.now(), title: "QQ 技术群经验已保存", description: "AI 整理来源与个人验证状态分别保留。" });
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
    <PageHeader eyebrow="ENGINEERING EXPERIENCE" title="工程经验" description="研发过程、经验总结和 QQ 技术群整理统一查看；原始日志关系保持在同一记录上。"
      actions={<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setTab("process")}>研发过程记录</Button><Button variant="outline" onClick={() => { setQqEditing(null); setQqOpen(true); }}><Plus />QQ 群经验</Button><Button onClick={() => { setEditing(null); setEditorOpen(true); }}><Plus />新增经验</Button></div>} />
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="工程经验分类">{([ ["all", "全部"], ["experience", "经验总结"], ["process", "研发过程记录"], ["qq", "QQ 技术群经验"] ] as const).map(([key, label]) =>
      <Button key={key} role="tab" aria-selected={tab === key} size="sm" variant={tab === key ? "default" : "outline"} onClick={() => setTab(key)}>{label}</Button>)}</div>
    <section className="grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-2 xl:grid-cols-4">
      <Input aria-label="搜索工程经验" placeholder="搜索标题、现象、排查和结论" value={query}
        onChange={(event) => setQuery(event.target.value)} />
      <Select aria-label="来源项目筛选" value={project} onChange={(event) => setProject(event.target.value)}>
        <option value="">全部来源项目</option>{data.projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        {projects.filter((value) => !data.projects.some((item) => item.id === value)).map((value) => <option key={value} value={value}>{value}</option>)}
      </Select>
      <Input aria-label="标签筛选" placeholder="筛选标签" value={tag} onChange={(event) => setTag(event.target.value)} />
      <Select aria-label="证据状态筛选" value={evidenceStatus}
        onChange={(event) => setEvidenceStatus(event.target.value as ExperienceEvidenceStatus | "全部")}>
        <option>全部</option>{evidenceStatuses.map((value) => <option key={value}>{value}</option>)}
      </Select>
      {tab === "qq" && <Select aria-label="QQ 经验验证状态" value={qqStatus} onChange={(event) => setQqStatus(event.target.value as typeof qqStatus)}>
        {(["全部", "待验证", "已实测", "部分适用"] as const).map((value) => <option key={value}>{value}</option>)}
      </Select>}
    </section>
    {(tab === "all" || tab === "process") && <EngineeringLogSection query={query} tag={tag} projectId={project}
      initialTaskId={searchParams.get("taskId") ?? undefined} selectedId={selectedId} openCreate={searchParams.get("create") === "log"} onSelect={selectRecord} />}
    {tab !== "process" && (items.length ? <section className="grid gap-4 xl:grid-cols-2">{items.map((item) => {
      if (!isEngineeringExperience(item)) return null;
      return <article key={item.id} className="min-w-0 rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap gap-2 text-xs"><span className="rounded bg-blue-50 px-2 py-1 text-blue-800">{item.experience.qq ? "QQ 技术群经验" : item.experience.sourceProject}</span>
          <span className="rounded bg-slate-100 px-2 py-1">审核：{item.experience.reviewStatus}</span>
          <span className="rounded bg-amber-50 px-2 py-1 text-amber-900">{item.experience.qq ? `验证：${item.experience.qq.verification}` : `证据：${item.experience.evidenceStatus}`}</span></div>
        <h2 className="mt-3 text-base font-semibold text-slate-900">{item.title}</h2>
        <p className="mt-2 line-clamp-2 text-sm text-slate-600">{item.experience.phenomenon}</p>
        <div className="mt-3 flex flex-wrap gap-1">{item.tags.map((value) =>
          <span key={value} className="rounded bg-slate-100 px-2 py-0.5 text-xs">#{value}</span>)}</div>
        <p className="mt-3 line-clamp-2 text-xs text-slate-500">适用：{item.experience.applicability}</p>
        <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">
          <Button size="sm" variant="outline" onClick={() => selectRecord(item.id)}>查看详情</Button>
          <Button size="sm" variant="ghost" onClick={() => { if (item.experience?.qq) { setQqEditing(item); setQqOpen(true); } else { setEditing(item); setEditorOpen(true); } }}>编辑</Button>
          {item.experience.reviewStatus === "待审核" && <Button size="sm" variant="ghost"
            onClick={() => { void review(item); }}><Check />标记已审核</Button>}
        </div>
      </article>;
    })}</section> : <EmptyState title={data.knowledgeItems.some(isEngineeringExperience) ? "没有符合条件的经验" : "还没有工程经验"}
      description="可从调试记录提炼经验，或运行限定范围的共享案例导入工具。"
      actionLabel="新增经验" onAction={() => { setEditing(null); setEditorOpen(true); }} />)}
    {selectedId && !selected && !data.workLogs.some((log) => log.id === selectedId) && <section role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <p>未找到这条工程经验。记录可能已删除，或链接中的 ID 有误。</p>
      <Button className="mt-3" size="sm" variant="outline" onClick={() => selectRecord(null)}>返回经验列表</Button>
    </section>}
    <ExperienceDetail item={selectedQq ? null : selected} version={selected ? snapshot.versions[`knowledge:${selected.id}`] : undefined}
      onClose={() => selectRecord(null)} onEdit={(item) => { selectRecord(null); setEditing(item); setEditorOpen(true); }} />
    <Dialog open={Boolean(selectedQq)} title={selectedQq?.title ?? "QQ 技术群经验"} onClose={() => selectRecord(null)} size="lg"
      footer={<><Button variant="outline" onClick={() => selectRecord(null)}>关闭</Button>{selectedQq && <Button onClick={() => { setQqEditing(selectedQq); setQqOpen(true); selectRecord(null); }}>编辑</Button>}</>}>
      {selectedQq && <div className="space-y-3 whitespace-pre-wrap break-words text-sm"><p className="text-xs text-slate-500">AI 整理来源：{selectedQq.experience?.qq?.sourceGroup || "未提供"} · 原讨论 {selectedQq.experience?.qq?.discussionDate || "日期未提供"} · 验证：{selectedQq.experience?.qq?.verification}</p>
        <p>{selectedQq.content}</p>{selectedQq.experience?.qq?.excerpt && <p>原文摘录：{selectedQq.experience.qq.excerpt}</p>}
        {selectedQq.experience?.qq?.screenshot && <img src={selectedQq.experience.qq.screenshot} alt="原讨论截图" className="max-h-72 object-contain" />}
        <p>我的补充：{selectedQq.experience?.qq?.supplement || "未填写"}</p><p>适用条件：{selectedQq.experience?.applicability}</p></div>}
    </Dialog>
    <ExperienceEditor open={editorOpen} item={editing} projects={data.projects}
      onClose={() => setEditorOpen(false)} onSubmit={save} />
    <QqExperienceEditor open={qqOpen} item={qqEditing} projects={data.projects} onClose={() => setQqOpen(false)} onSubmit={saveQq} />
    <ActionToast notice={notice} onDismiss={() => setNotice(null)} />
  </div>;
}
