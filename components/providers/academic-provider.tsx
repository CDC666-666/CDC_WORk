"use client";

import { createContext, useCallback, useEffect, useMemo, useState } from "react";

import { useWorkspaceData } from "@/hooks/use-workspace-data";
import { academicDomainService, type AcademicCollection, type AcademicEntity, type AcademicService } from "@/services/academic-service";
import type { AcademicState } from "@/types/workspace";

const emptyAcademic: AcademicState = {
  semesters: [], courses: [], chapters: [], classSessions: [], assignments: [], exams: [],
};

export interface AcademicContextValue extends Pick<AcademicService, "create" | "update" | "delete"> {
  state: AcademicState;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  reload(): Promise<void>;
  clearError(): void;
}

export const AcademicContext = createContext<AcademicContextValue | null>(null);

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "课程数据操作失败，请重试。";
}

export function AcademicProvider({ children }: { children: React.ReactNode }) {
  const workspace = useWorkspaceData();
  const [state, setState] = useState<AcademicState>(emptyAcademic);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      setState(await academicDomainService.loadState());
      setError(null);
    } catch (cause: unknown) {
      setError(errorMessage(cause));
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
      setState(await academicDomainService.loadState());
      setError(null);
      return result;
    } catch (cause: unknown) {
      setError(errorMessage(cause));
      throw cause;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const create = useCallback(<K extends AcademicCollection,>(collection: K, draft: Omit<AcademicEntity<K>, "id">) =>
    commit(() => academicDomainService.create(collection, draft)), [commit]);
  const update = useCallback(<K extends AcademicCollection,>(collection: K, id: string,
    patch: Partial<Omit<AcademicEntity<K>, "id">>) =>
    commit(() => academicDomainService.update(collection, id, patch)), [commit]);
  const remove = useCallback(<K extends AcademicCollection,>(collection: K, id: string) =>
    commit(() => academicDomainService.delete(collection, id)), [commit]);

  const value = useMemo<AcademicContextValue>(() => ({
    state, isLoading, isSaving, error, reload, clearError: () => setError(null),
    create, update, delete: remove,
  }), [state, isLoading, isSaving, error, reload, create, update, remove]);

  return <AcademicContext.Provider value={value}>{children}</AcademicContext.Provider>;
}
