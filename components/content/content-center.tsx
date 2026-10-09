"use client";

import { useMemo, useState } from "react";
import { BookMarked, BrainCircuit, Inbox, PlusCircle } from "lucide-react";

import { ContentCard } from "@/components/content/content-card";
import { ContentFiltersPanel } from "@/components/content/content-filters";
import { ContentSummaryDialog } from "@/components/content/content-summary-dialog";
import {
  ActionToast,
  type ToastNotice,
} from "@/components/layout/action-toast";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { useContentItems } from "@/hooks/use-content-items";
import { useWorkspaceData } from "@/hooks/use-workspace-data";
import { knowledgeFromContent } from "@/services/knowledge-service";
import {
  defaultContentFilters,
  filterAndSortContent,
  getContentStatistics,
} from "@/lib/content";
import { cn } from "@/lib/utils";
import type {
  ContentFilters,
  ContentItem,
  ContentViewMode,
  TechnicalTag,
} from "@/types/content";

interface ContentCenterProps {
  initialItems: ContentItem[];
  tags: TechnicalTag[];
}

export function ContentCenter({ initialItems, tags }: ContentCenterProps) {
  const workspace = useWorkspaceData();
  const { items, updateItem: saveItem } = useContentItems(initialItems);
  const [filters, setFilters] = useState<ContentFilters>(defaultContentFilters);
  const [viewMode, setViewMode] = useState<ContentViewMode>("card");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [notice, setNotice] = useState<ToastNotice | null>(null);

  const filteredItems = useMemo(
    () => filterAndSortContent(items, filters),
    [filters, items],
  );
  const statistics = useMemo(() => getContentStatistics(items), [items]);
  const selectedItem = items.find((item) => item.id === selectedItemId) ?? null;

  const showNotice = (title: string, description: string) => {
    setNotice({ id: Date.now(), title, description });
  };

  const updateItem = async (itemId: string, updater: (item: ContentItem) => ContentItem) => {
    try { await saveItem(itemId, updater); }
    catch (cause: unknown) { showNotice("保存失败", cause instanceof Error ? cause.message : "服务器写入失败。"); }
  };

  const toggleFavorite = (itemId: string) => {
    updateItem(itemId, (item) => ({ ...item, isFavorite: !item.isFavorite }));
  };

  const toggleWatchLater = (itemId: string) => {
    updateItem(itemId, (item) => ({
      ...item,
      status: item.status === "watchLater" ? "unprocessed" : "watchLater",
    }));
  };

  const toggleCompleted = (itemId: string) => {
    updateItem(itemId, (item) => ({
      ...item,
      status: item.status === "completed" ? "unprocessed" : "completed",
    }));
  };

  const addToKnowledgeBase = async (itemId: string) => {
    const content = items.find((item) => item.id === itemId);
    if (content && !workspace.data.knowledgeItems.some((item) => item.sourceType === "content" && item.sourceId === content.id)) {
      try { await workspace.dispatch({ type: "knowledge/added", item: knowledgeFromContent(content) }); }
      catch (cause: unknown) { showNotice("加入失败", cause instanceof Error ? cause.message : "服务器写入失败。"); return; }
    }
    try { await saveItem(itemId, (item) => ({ ...item, isInKnowledgeBase: true })); }
    catch (cause: unknown) { showNotice("保存失败", cause instanceof Error ? cause.message : "服务器写入失败。"); return; }
    showNotice("已加入知识库", content ? "已创建可追溯的视频或文章知识条目。" : "没有找到对应内容。");
  };

  const addToStudyPlan = async (itemId: string) => {
    const content = items.find((item) => item.id === itemId);
    if (!content) {
      showNotice("加入失败", "没有找到对应的技术内容。 ");
      return;
    }
    let wasAdded: boolean;
    try {
      wasAdded = await workspace.addTaskFromContent({ id: content.id, title: content.title,
        durationMinutes: content.durationMinutes });
      await saveItem(itemId, (item) => ({ ...item, isInStudyPlan: true }));
    } catch (cause: unknown) {
      showNotice("加入失败", cause instanceof Error ? cause.message : "服务器写入失败。");
      return;
    }
    showNotice(
      wasAdded ? "已加入今日任务" : "任务已存在",
      wasAdded
        ? "已创建内容学习任务，可在今日任务和工作台首页查看。"
        : "同一内容已经存在学习任务，未重复添加。",
    );
  };

  const openDemoLink = (item: ContentItem) => {
    showNotice("当前为演示链接", `${item.title} 尚未绑定真实平台地址。`);
    window.open(item.originalUrl, "_blank", "noopener,noreferrer");
  };

  const updateFilters = (changes: Partial<ContentFilters>) => {
    setFilters((current) => ({ ...current, ...changes }));
  };

  const resetFilters = () => setFilters(defaultContentFilters);

  const stats = [
    { label: "本周新增", value: statistics.weeklyAdded, icon: PlusCircle, tone: "text-blue-600 bg-blue-50" },
    { label: "待处理", value: statistics.pending, icon: Inbox, tone: "text-amber-600 bg-amber-50" },
    { label: "已总结", value: statistics.summarized, icon: BrainCircuit, tone: "text-violet-600 bg-violet-50" },
    { label: "已加入知识库", value: statistics.knowledgeBase, icon: BookMarked, tone: "text-emerald-600 bg-emerald-50" },
  ];

  return (
    <div className="space-y-5 lg:space-y-6">
      <PageHeader
        eyebrow="LEARNING CONTENT HUB"
        title="视频与技术内容"
        description="发现、筛选和整理与你当前学习及项目相关的技术内容。"
        actions={
          <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
            当前为演示数据
          </span>
        }
      />

      <section aria-label="内容统计" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article key={stat.label} className="flex items-center gap-3 rounded-lg border border-border bg-white p-4 shadow-sm">
              <div className={cn("grid h-9 w-9 place-items-center rounded-md", stat.tone)}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500">{stat.label}</p>
                <p className="mt-0.5 text-xl font-semibold text-slate-950">{stat.value}</p>
              </div>
            </article>
          );
        })}
      </section>

      <ContentFiltersPanel
        filters={filters}
        resultCount={filteredItems.length}
        tags={tags}
        viewMode={viewMode}
        onChange={updateFilters}
        onClear={resetFilters}
        onViewModeChange={setViewMode}
      />

      {filteredItems.length > 0 ? (
        <section
          aria-label="技术内容列表"
          className={cn("grid gap-4", viewMode === "card" ? "xl:grid-cols-2" : "grid-cols-1")}
        >
          {filteredItems.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              viewMode={viewMode}
              onAddToKnowledgeBase={addToKnowledgeBase}
              onAddToStudyPlan={addToStudyPlan}
              onOpenDemoLink={openDemoLink}
              onShowSummary={(contentItem) => setSelectedItemId(contentItem.id)}
              onToggleCompleted={toggleCompleted}
              onToggleFavorite={toggleFavorite}
              onToggleWatchLater={toggleWatchLater}
            />
          ))}
        </section>
      ) : (
        <EmptyState
          title="没有符合条件的技术内容"
          description="尝试更换关键词或减少筛选条件。演示数据包含 RoboMaster、STM32、控制、视觉、C++ 和 Ubuntu 等方向。"
          actionLabel="清除全部筛选"
          onAction={resetFilters}
        />
      )}

      <ContentSummaryDialog
        item={selectedItem}
        onAddToKnowledgeBase={addToKnowledgeBase}
        onClose={() => setSelectedItemId(null)}
      />
      <ActionToast notice={notice} onDismiss={() => setNotice(null)} />
    </div>
  );
}
