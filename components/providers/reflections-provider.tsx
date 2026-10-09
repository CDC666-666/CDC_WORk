"use client";

import { createContext, useCallback, useMemo, useState } from "react";

import { useWorkspaceData } from "@/hooks/use-workspace-data";
import { canonicalReflectionDate } from "@/services/reflection-period";
import { createWorkspaceId } from "@/services/workspace-service";
import type { ReviewService } from "@/services/review-service";
import type { ProjectVNext } from "@/types/project";
import type { Review } from "@/types/review";

interface ReflectionsContextValue extends Pick<ReviewService, "create" | "update" | "delete"> {
  reviews: Review[];
  projects: ProjectVNext[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  loadError: boolean;
  reload(): Promise<void>;
  clearError(): void;
}

export const ReflectionsContext = createContext<ReflectionsContextValue | null>(null);

export function ReflectionsProvider({ children }: { children: React.ReactNode }) {
  const workspace = useWorkspaceData();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const commit = useCallback(async <T,>(operation: () => Promise<T>): Promise<T> => {
    setIsSaving(true);
    try {
      const result = await operation();
      setError(null);
      return result;
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "总结保存失败。");
      throw cause;
    } finally { setIsSaving(false); }
  }, []);

  const create = useCallback((draft: Omit<Review, "id">) => commit(async () => {
    const item: Review = { ...draft, id: createWorkspaceId("review"),
      date: canonicalReflectionDate(draft.type, draft.date) };
    await workspace.mutateEntity("reviews", "create", item.id, item as unknown as Record<string, unknown>);
    return item;
  }), [commit, workspace]);
  const update = useCallback((id: string, patch: Partial<Omit<Review, "id">>) => commit(async () => {
    const previous = workspace.domain.reviews.find((item) => item.id === id);
    if (!previous) throw new Error("总结不存在，请重新加载。");
    const item: Review = { ...previous, ...patch, id,
      date: canonicalReflectionDate(patch.type ?? previous.type, patch.date ?? previous.date) };
    const result = await workspace.mutateEntity("reviews", "update", id, item as unknown as Record<string, unknown>);
    return result.item as unknown as Review;
  }), [commit, workspace]);
  const remove = useCallback((id: string) => commit(async () => {
    await workspace.mutateEntity("reviews", "delete", id);
    return true;
  }), [commit, workspace]);

  const value = useMemo<ReflectionsContextValue>(() => ({
    reviews: workspace.domain.reviews, projects: workspace.domain.projects,
    isLoading: !workspace.isHydrated, isSaving, error: error ?? workspace.error,
    loadError: Boolean(workspace.error), reload: workspace.reload, clearError: () => setError(null),
    create, update, delete: remove,
  }), [workspace, isSaving, error, create, update, remove]);
  return <ReflectionsContext.Provider value={value}>{children}</ReflectionsContext.Provider>;
}
