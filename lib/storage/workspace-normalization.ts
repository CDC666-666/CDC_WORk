import type { WorkspaceData } from "@/types/workspace";

export interface WorkspaceNormalizationResult {
  data: WorkspaceData;
  removedCalendarEventCount: number;
}

export function normalizeWorkspaceDataWithResult(
  data: WorkspaceData,
): WorkspaceNormalizationResult {
  const calendarEvents = data.calendarEvents.filter(
    (event) => event.sourceType === "manual",
  );
  const removedCalendarEventCount = data.calendarEvents.length - calendarEvents.length;

  return {
    data: removedCalendarEventCount > 0 ? { ...data, calendarEvents } : data,
    removedCalendarEventCount,
  };
}

export function normalizeWorkspaceData(data: WorkspaceData): WorkspaceData {
  return normalizeWorkspaceDataWithResult(data).data;
}
