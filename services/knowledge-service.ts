import { createWorkspaceId } from "@/services/workspace-service";
import type { ContentItem } from "@/types/content";
import type { KnowledgeItem, KnowledgeItemDraft } from "@/types/knowledge";
import type { ReadingItem } from "@/types/reading";
import type { TestRecord } from "@/types/testing";

export function createKnowledgeItem(draft: KnowledgeItemDraft, now = new Date()): KnowledgeItem { const timestamp = now.toISOString(); return { ...draft, id: createWorkspaceId("knowledge"), createdAt: timestamp, updatedAt: timestamp }; }
export function knowledgeFromContent(item: ContentItem, now = new Date()): KnowledgeItem { return createKnowledgeItem({ title: item.title, content: item.aiSummary.overview, summary: item.projectRelevance, itemType: item.contentType === "video" ? "视频总结" : "文章", category: item.tags[0]?.label ?? "技术内容", sourceType: "content", sourceId: item.id, sourceUrl: item.originalUrl, tags: item.tags.map((tag) => tag.label), status: "收件箱", importance: item.recommendationScore >= 90 ? 5 : 4 }, now); }
export function knowledgeFromReading(item: ReadingItem, now = new Date()): KnowledgeItem { return createKnowledgeItem({ title: `《${item.title}》读书笔记`, content: item.notes || "请补充阅读笔记。", summary: `已阅读 ${item.currentPage}/${item.totalPages} 页。`, itemType: "读书笔记", category: item.category, sourceType: "reading", sourceId: item.id, sourceUrl: "", tags: [...item.tags], status: "收件箱", importance: 3 }, now); }
export function knowledgeFromTest(item: TestRecord, now = new Date()): KnowledgeItem { return createKnowledgeItem({ title: `${item.title}：测试结论`, content: `目标：${item.objective}\n\n步骤：${item.procedure}\n\n实际结果：${item.actualResult}\n\n结论：${item.conclusion}`, summary: item.conclusion, itemType: "测试结论", category: "测试复盘", sourceType: "test", sourceId: item.id, projectId: item.projectId, moduleId: item.moduleId, sourceUrl: "", tags: [item.resultStatus], status: "收件箱", importance: item.resultStatus === "失败" ? 5 : 4 }, now); }

