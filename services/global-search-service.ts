import { navigationItems } from "@/lib/navigation";
import type { WorkspaceData } from "@/types/workspace";

export interface GlobalSearchResult {
  id: string;
  type: "功能" | "任务" | "项目" | "日志" | "问题" | "知识" | "阅读";
  title: string;
  summary: string;
  href: string;
}

export function searchWorkspace(data: WorkspaceData, query: string): GlobalSearchResult[] {
  const normalized = query.trim().toLocaleLowerCase("zh-CN");
  const matches = (value: string) => !normalized || value.toLocaleLowerCase("zh-CN").includes(normalized);
  const results: GlobalSearchResult[] = [
    ...navigationItems.filter((item) => matches(`${item.label} ${item.description}`)).map((item) => ({ id: `nav-${item.href}`, type: "功能" as const, title: item.label, summary: item.description, href: item.href })),
    ...data.tasks.filter((item) => matches(`${item.title} ${item.description} ${item.tags.join(" ")}`)).map((item) => ({ id: `task-${item.id}`, type: "任务" as const, title: item.title, summary: `${item.status} · ${item.domain}`, href: "/today" })),
    ...data.projects.filter((item) => matches(`${item.name} ${item.code} ${item.description}`)).map((item) => ({ id: `project-${item.id}`, type: "项目" as const, title: item.name, summary: `${item.code} · ${item.status}`, href: `/projects/${item.id}` })),
    ...data.workLogs.filter((item) => matches(`${item.title} ${item.workContent} ${item.result}`)).map((item) => ({ id: `log-${item.id}`, type: "日志" as const, title: item.title, summary: `${item.date} · ${item.resultStatus}`, href: `/logs?projectId=${item.projectId}` })),
    ...data.technicalIssues.filter((item) => matches(`${item.title} ${item.phenomenon} ${item.rootCause}`)).map((item) => ({ id: `issue-${item.id}`, type: "问题" as const, title: item.title, summary: `${item.severity} · ${item.status}`, href: `/reviews?projectId=${item.projectId}` })),
    ...data.knowledgeItems.filter((item) => matches(`${item.title} ${item.summary} ${item.content} ${item.tags.join(" ")}`)).map((item) => ({ id: `knowledge-${item.id}`, type: "知识" as const, title: item.title, summary: `${item.itemType} · ${item.status}`, href: item.projectId ? `/knowledge?projectId=${item.projectId}` : "/knowledge" })),
    ...data.readingItems.filter((item) => matches(`${item.title} ${item.author} ${item.tags.join(" ")}`)).map((item) => ({ id: `reading-${item.id}`, type: "阅读" as const, title: item.title, summary: `${item.author} · ${item.status}`, href: "/reading" })),
  ];
  return results.slice(0, 18);
}
