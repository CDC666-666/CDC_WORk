export type CalendarEventType = "课程" | "任务" | "学习" | "阅读" | "项目" | "比赛" | "个人";
export type CalendarSourceType = "manual" | "task" | "studyPlan" | "reading" | "milestone";

export interface CalendarEvent {
  id: string;
  title: string;
  eventType: CalendarEventType;
  startAt: string;
  endAt: string;
  allDay: boolean;
  sourceType: CalendarSourceType;
  sourceId?: string;
  colorKey: "blue" | "green" | "amber" | "rose" | "violet" | "slate";
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type CalendarEventDraft = Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">;

