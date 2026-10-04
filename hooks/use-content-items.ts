"use client";

import { useCallback, useMemo } from "react";

import { useWorkspaceData } from "@/hooks/use-workspace-data";
import type { ContentItem } from "@/types/content";

/** The catalog remains demo content; only each item's personal state is persisted. */
export function useContentItems(initialItems: ContentItem[]) {
  const workspace = useWorkspaceData();
  const items = useMemo(() => initialItems.map((item) => ({
    ...item, ...(workspace.snapshot.contentStates[item.id] ?? {}),
  })), [initialItems, workspace.snapshot.contentStates]);
  const updateItem = useCallback(async (itemId: string, updater: (item: ContentItem) => ContentItem) => {
    const current = items.find((item) => item.id === itemId);
    if (!current) throw new Error("内容条目不存在。");
    const next = updater(current);
    const flags = { id: itemId, status: next.status, isFavorite: next.isFavorite,
      isInKnowledgeBase: next.isInKnowledgeBase, isInStudyPlan: next.isInStudyPlan };
    await workspace.mutateEntity("contentStates",
      workspace.snapshot.versions[`contentStates:${itemId}`] ? "update" : "create", itemId, flags);
  }, [items, workspace]);
  return { items, updateItem };
}
