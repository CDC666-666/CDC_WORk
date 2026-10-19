import "server-only";

import { mockContentItems } from "@/data/mock-content";
import { projectDomainToWorkspaceV3 } from "@/lib/storage/workspace-migration";
import { reflectionBody } from "@/services/reflection-period";
import type { ServerWorkspaceSnapshot } from "@/types/server-workspace";

export interface SearchResult {
  id: string; type: string; title: string; summary: string; source: string;
  href: string; projectId?: string; tags: string[]; score: number;
}

interface Candidate extends Omit<SearchResult, "score" | "summary"> { body: string; searchText: string; }

const lower = (value: string) => value.toLocaleLowerCase("zh-CN");
const encoded = (value: string) => encodeURIComponent(value);

export function searchServerWorkspace(snapshot: ServerWorkspaceSnapshot, query: string, filters: {
  type?: string; projectId?: string; tag?: string;
} = {}): SearchResult[] {
  const terms = lower(query.trim()).split(/\s+/).filter(Boolean).slice(0, 8);
  if (!terms.length) return [];
  const domain = snapshot.domain;
  const data = projectDomainToWorkspaceV3(domain);
  const candidates: Candidate[] = [];
  const add = (type: string, id: string, title: string, body: string, href: string,
    projectId?: string, tags: string[] = [], source = "") => {
    candidates.push({ id: `${type}:${id}`, type, title, body, href, projectId,
      tags, source, searchText: `${title} ${body} ${tags.join(" ")} ${source}` });
  };
  for (const item of domain.projects) add("项目", item.id, item.name, JSON.stringify(item), `/projects/${encoded(item.id)}`, item.id, item.tags, item.code);
  for (const item of data.tasks) add("任务", item.id, item.title, JSON.stringify(item), `/calendar?record=${encoded(`derived-task-${item.id}`)}`, item.projectId, item.tags, item.domain);
  for (const item of domain.academic.courses) add("课程", item.id, item.name, JSON.stringify(item), `/academic/${encoded(item.id)}`, undefined, [], item.teacher);
  for (const item of domain.academic.chapters) add("课程记录", item.id, item.title, `${item.content} ${JSON.stringify(item)}`, `/academic/${encoded(item.courseId)}?record=${encoded(item.id)}`);
  for (const item of domain.academic.classSessions) add("课程记录", item.id, item.summary, `${item.notes} ${JSON.stringify(item)}`, `/academic/${encoded(item.courseId)}?record=${encoded(item.id)}`);
  for (const item of domain.academic.assignments) add("作业", item.id, item.title, `${item.description} ${JSON.stringify(item)}`, `/academic/${encoded(item.courseId)}?record=${encoded(item.id)}`);
  for (const item of domain.reviews) add("总结", item.id, item.summary, `${reflectionBody(item)} ${JSON.stringify(item)}`,
    `/reflections?reviewId=${encoded(item.id)}`, item.relatedProjectId);
  for (const item of data.workLogs) add("工程经验", item.id, item.title, JSON.stringify(item), `/experiences?record=${encoded(item.id)}`, item.projectId, item.tags, "研发过程记录");
  for (const item of data.knowledgeItems) {
    const type = item.itemType === "工程经验" ? "工程经验" : "知识库";
    if (type === "工程经验" && item.sourceId && data.workLogs.some((log) => log.id === item.sourceId)) continue;
    const detail = item.experience ? { ...item.experience, qq: item.experience.qq ? { ...item.experience.qq, screenshot: undefined } : undefined } : {};
    add(type, item.id, item.title, `${item.content} ${item.summary} ${JSON.stringify(detail)}`,
      type === "工程经验" ? `/experiences?record=${encoded(item.id)}` : `/knowledge?record=${encoded(item.id)}`,
      item.projectId, item.tags, item.experience?.qq ? `QQ 技术群 · ${item.experience.qq.sourceGroup ?? ""}` : item.category);
  }
  for (const item of data.technicalIssues) add("技术问题", item.id, item.title, JSON.stringify(item), `/reviews?record=${encoded(item.id)}`, item.projectId, [], item.severity);
  for (const item of data.testRecords) add("测试记录", item.id, item.title, JSON.stringify(item), `/reviews?record=${encoded(item.id)}`, item.projectId);
  for (const item of data.readingItems) add("阅读", item.id, item.title, JSON.stringify(item), `/reading?record=${encoded(item.id)}`, undefined, item.tags, item.author);
  for (const item of mockContentItems) {
    add(item.contentType === "video" ? "视频内容" : "技术内容", item.id, item.title,
      `${item.rawDescription} ${item.aiSummary.overview} ${item.aiSummary.keyPoints.join(" ")}`,
      `/content?record=${encoded(item.id)}`, undefined, item.tags.map((tag) => tag.label), item.source);
  }
  for (const item of data.calendarEvents.filter((event) => event.sourceType === "manual")) add("日历事项", item.id, item.title,
    `${item.notes} ${JSON.stringify(item)}`, `/calendar?record=${encoded(item.id)}`);

  const seen = new Set<string>();
  return candidates.filter((item) => {
    if (seen.has(item.id) || filters.type && item.type !== filters.type || filters.projectId && item.projectId !== filters.projectId ||
      filters.tag && !item.tags.some((tag) => lower(tag).includes(lower(filters.tag!)))) return false;
    const haystack = lower(item.searchText);
    if (!terms.every((term) => haystack.includes(term))) return false;
    seen.add(item.id);
    return true;
  }).map((item) => {
    const title = lower(item.title);
    const tags = lower(item.tags.join(" "));
    const score = title === terms.join(" ") ? 400 : terms.every((term) => title.includes(term)) ? 300 :
      terms.some((term) => title.includes(term)) ? 240 : terms.some((term) => tags.includes(term)) ? 160 : 100;
    const body = item.body.replace(/\s+/g, " ");
    const hit = terms.map((term) => lower(body).indexOf(term)).find((offset) => offset >= 0) ?? 0;
    const start = Math.max(0, hit - 45);
    return { id: item.id, type: item.type, title: item.title, href: item.href, projectId: item.projectId,
      tags: item.tags, source: item.source, score, summary: body.slice(start, start + 150) };
  }).sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "zh-CN")).slice(0, 60);
}
