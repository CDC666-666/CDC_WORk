"use client";

import { createContext, useCallback, useMemo, useState } from "react";

import { useWorkspaceData } from "@/hooks/use-workspace-data";
import { createWorkspaceId } from "@/services/workspace-service";
import type { AcademicCollection, AcademicEntity, AcademicService } from "@/services/academic-service";
import type { AcademicState } from "@/types/workspace";

export interface AcademicContextValue extends Pick<AcademicService, "create" | "update" | "delete"> {
  state: AcademicState;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  reload(): Promise<void>;
  clearError(): void;
}

export const AcademicContext = createContext<AcademicContextValue | null>(null);

export function AcademicProvider({ children }: { children: React.ReactNode }) {
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
      setError(cause instanceof Error ? cause.message : "课程数据保存失败。");
      throw cause;
    } finally { setIsSaving(false); }
  }, []);

  const create = useCallback(<K extends AcademicCollection,>(collection: K,
    draft: Omit<AcademicEntity<K>, "id">): Promise<AcademicEntity<K>> => commit(async () => {
    const item = { ...draft, id: createWorkspaceId(collection.slice(0, -1)) } as AcademicEntity<K>;
    await workspace.mutateEntity(collection, "create", item.id, item as unknown as Record<string, unknown>);
    return item;
  }), [commit, workspace]);
  const update = useCallback(<K extends AcademicCollection,>(collection: K, id: string,
    patch: Partial<Omit<AcademicEntity<K>, "id">>): Promise<AcademicEntity<K>> => commit(async () => {
    const result = await workspace.mutateEntity(collection, "update", id, patch as Record<string, unknown>);
    return result.item as unknown as AcademicEntity<K>;
  }), [commit, workspace]);
  const remove = useCallback(<K extends AcademicCollection,>(collection: K, id: string): Promise<boolean> =>
    commit(async () => {
      await workspace.mutateEntity(collection, "delete", id);
      return true;
    }), [commit, workspace]);

  const value = useMemo<AcademicContextValue>(() => ({
    state: workspace.domain.academic, isLoading: !workspace.isHydrated, isSaving,
    error: error ?? workspace.error, reload: workspace.reload, clearError: () => setError(null),
    create, update, delete: remove,
  }), [workspace, isSaving, error, create, update, remove]);
  return <AcademicContext.Provider value={value}>{children}</AcademicContext.Provider>;
}
