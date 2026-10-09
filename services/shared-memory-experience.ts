import { createHash } from "node:crypto";
import type { KnowledgeItem } from "@/types/knowledge";

/** The only source accepted by the first one-time import. No case body is kept in Git. */
export const AUTO_AIM_CASE_SOURCE = "shared-memory/cases/auto-aim-init-alignment.md";

function section(markdown: string, name: string): string {
  const headings = [...markdown.matchAll(/^## (.+)\r?$/gm)];
  const heading = headings.find((match) => match[1] === name || match[1].startsWith(`${name}与`));
  if (!heading || heading.index === undefined) throw new Error(`案例缺少“${name}”章节`);
  const next = headings.find((match) => (match.index ?? 0) > (heading.index ?? 0));
  return markdown.slice(heading.index + heading[0].length, next?.index ?? markdown.length).trim();
}

export function sharedCaseKnowledgeId(workspaceId: string): string {
  if (!workspaceId) throw new Error("必须指定目标工作区 ID");
  return `experience-${createHash("sha256").update(`${workspaceId}|${AUTO_AIM_CASE_SOURCE}`).digest("hex").slice(0, 32)}`;
}

export function parseAutoAimCase(markdown: string, workspaceId: string, now = new Date()): KnowledgeItem {
  const title = /^# (.+)\r?$/m.exec(markdown)?.[1]?.trim();
  const sourceProject = /\*\*来源项目：\*\*\s*`([^`]+)`/.exec(markdown)?.[1];
  const historicalDate = /\*\*历史事件：\*\*\s*(\d{4}-\d{2}-\d{2})/.exec(markdown)?.[1];
  const lowerCommit = /StandardRobotpp[^\n]*?master@([a-f0-9]{40})/.exec(markdown)?.[1];
  const upperCommit = /sp_vision_25\/main@([a-f0-9]{40})/.exec(markdown)?.[1];
  const keywordLine = /\*\*关键词：\*\*\s*([^\r\n]+)/.exec(markdown)?.[1] ?? "";
  if (!title || sourceProject !== "auto_aim" || !historicalDate || !lowerCommit || !upperCommit) {
    throw new Error("案例标题、来源项目、日期或代码基线不完整，停止导入");
  }
  const phenomenon = section(markdown, "现象");
  const cause = section(markdown, "原因");
  const verificationResult = section(markdown, "验证结果");
  const evidenceSources = section(markdown, "来源").split(/\r?\n/)
    .filter((line) => line.startsWith("- ")).map((line) => line.slice(2).trim());
  if (!evidenceSources.length) throw new Error("案例没有可追溯来源，停止导入");
  const openQuestions = /- \*\*待确认：\*\*\s*(.+)/.exec(verificationResult)?.[1]?.trim();
  if (!openQuestions) throw new Error("案例缺少待确认边界，停止导入");
  const timestamp = now.toISOString();
  return {
    id: sharedCaseKnowledgeId(workspaceId), title, content: phenomenon, summary: cause,
    itemType: "工程经验", category: "工程经验", sourceType: "sharedMemory",
    sourceId: AUTO_AIM_CASE_SOURCE, sourceUrl: "", status: "已整理", importance: 4,
    tags: keywordLine.split(/[、，,。]/).map((tag) => tag.trim()).filter(Boolean),
    createdAt: timestamp, updatedAt: timestamp,
    experience: {
      phenomenon, sourceProject, environment: section(markdown, "环境"),
      sourceVersion: `历史事件 ${historicalDate}；本机源码 StandardRobotpp/master@${lowerCommit}、sp_vision_25/main@${upperCommit}；当次 C 板固件与 Ubuntu 运行程序待确认。`,
      investigation: section(markdown, "排查过程"), failedAttempts: section(markdown, "失败尝试"),
      cause, resolution: section(markdown, "解决办法"), verificationResult, evidenceSources,
      applicability: section(markdown, "适用条件"), limitations: section(markdown, "不适用条件"),
      openQuestions, reviewStatus: "待审核", evidenceStatus: "历史现场反馈",
      sourceKey: AUTO_AIM_CASE_SOURCE,
      sourceRevision: createHash("sha256").update(markdown).digest("hex"),
    },
  };
}
