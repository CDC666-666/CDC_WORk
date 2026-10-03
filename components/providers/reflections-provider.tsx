"use client";

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useWorkspaceData } from "@/hooks/use-workspace-data";
import { reviewDomainService, type ReviewService } from "@/services/review-service";
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

function message(cause: unknown): string {
  return cause instanceof Error ? cause.message : "总结数据操作失败，请重试。";
}

export function ReflectionsProvider({ children }: { children: React.ReactNode }) {
  const workspace = useWorkspaceData();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [projects, setProjects] = useState<ProjectVNext[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const state = await reviewDomainService.loadState();
      setReviews(state.reviews);
      setProjects(state.projects);
      setError(null);
      setLoadError(false);
    } catch (cause: unknown) {
      setError(message(cause));
      setLoadError(true);
      throw cause;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (workspace.isHydrated) void reload().catch(() => undefined);
  }, [reload, workspace.domainRevision, workspace.isHydrated]);

  const commit = useCallback(async <T,>(operation: () => Promise<T>): Promise<T> => {
    setIsSaving(true);
    try {
      const result = await operation();
      const state = await reviewDomainService.loadState();
      setReviews(state.reviews);
      setProjects(state.projects);
      setError(null);
      return result;
    } catch (cause: unknown) {
      setError(message(cause));
      throw cause;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const create = useCallback((draft: Omit<Review, "id">) =>
    commit(() => reviewDomainService.create(draft)), [commit]);
  const update = useCallback((id: string, patch: Partial<Omit<Review, "id">>) =>
    commit(() => reviewDomainService.update(id, patch)), [commit]);
  const remove = useCallback((id: string) =>
    commit(() => reviewDomainService.delete(id)), [commit]);

  const availableProjects = useMemo(() => [
    ...projects,
    ...workspace.data.projects.filter((item) => !projects.some((current) => current.id === item.id))
      .map((item): ProjectVNext => ({ ...item, tags: [], visibility: "PRIVATE" })),
  ], [projects, workspace.data.projects]);

  const value = useMemo<ReflectionsContextValue>(() => ({
    reviews, projects: availableProjects, isLoading, isSaving, error, loadError, reload,
    clearError: () => setError(null), create, update, delete: remove,
  }), [reviews, availableProjects, isLoading, isSaving, error, loadError, reload, create, update, remove]);

  return <ReflectionsContext.Provider value={value}>{children}</ReflectionsContext.Provider>;
}
