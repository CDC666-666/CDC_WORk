import { createWorkspaceId } from "@/services/workspace-service";
import type { WorkLog, WorkLogDraft } from "@/types/engineering-log";
import type { KnowledgeItem } from "@/types/knowledge";
import type { IssueSolution, IssueSolutionDraft, TechnicalIssue, TechnicalIssueDraft, TestRecord, TestRecordDraft } from "@/types/testing";

export function createWorkLog(draft: WorkLogDraft, now = new Date()): WorkLog {
  const timestamp = now.toISOString();
  return { ...draft, id: createWorkspaceId("log"), createdAt: timestamp, updatedAt: timestamp };
}

export function createTestRecord(draft: TestRecordDraft, now = new Date()): TestRecord {
  const timestamp = now.toISOString();
  return { ...draft, id: createWorkspaceId("test"), createdAt: timestamp, updatedAt: timestamp };
}

export function createTechnicalIssue(draft: TechnicalIssueDraft, now = new Date()): TechnicalIssue {
  const timestamp = now.toISOString();
  return { ...draft, id: createWorkspaceId("issue"), createdAt: timestamp, updatedAt: timestamp };
}

export function createIssueSolution(draft: IssueSolutionDraft, now = new Date()): IssueSolution {
  return { ...draft, id: createWorkspaceId("solution"), createdAt: now.toISOString() };
}

export function knowledgeFromWorkLog(log: WorkLog, now = new Date()): KnowledgeItem {
  const timestamp = now.toISOString();
  return {
    id: createWorkspaceId("knowledge"), title: `${log.title}：工程经验`, content: `${log.workContent}\n\n结果：${log.result}\n\n问题：${log.problems}\n\n下一步：${log.nextPlan}`,
    summary: log.result || log.workContent.slice(0, 80), itemType: "项目经验", category: "工程日志", sourceType: "workLog",
    sourceId: log.id, projectId: log.projectId, moduleId: log.moduleId, sourceUrl: "", tags: [...log.tags], status: "收件箱",
    importance: 3, createdAt: timestamp, updatedAt: timestamp,
  };
}

export function knowledgeFromIssue(issue: TechnicalIssue, solution: IssueSolution | undefined, now = new Date()): KnowledgeItem {
  const timestamp = now.toISOString();
  return {
    id: createWorkspaceId("knowledge"), title: `${issue.title}：解决方案`,
    content: `现象：${issue.phenomenon}\n\n根因：${issue.rootCause || "待补充"}\n\n方案：${solution?.content ?? "待补充"}\n\n验证：${solution?.result ?? "待验证"}`,
    summary: solution?.result || issue.rootCause || issue.probableCause, itemType: "故障方案", category: "问题复盘", sourceType: "issue",
    sourceId: issue.id, projectId: issue.projectId, moduleId: issue.moduleId, sourceUrl: "", tags: [issue.severity, issue.status],
    status: "收件箱", importance: issue.severity === "S1" ? 5 : issue.severity === "S2" ? 4 : 3, createdAt: timestamp, updatedAt: timestamp,
  };
}

