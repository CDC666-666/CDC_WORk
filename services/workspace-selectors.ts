import type { CalendarEvent } from "@/types/calendar";
import type { Project } from "@/types/project";
import type { WorkspaceData } from "@/types/workspace";
import type { Review } from "@/types/review";
import { reflectionPeriod, reflectionPeriodLabel, reflectionTypeLabels, reflectionBody } from "@/services/reflection-period";

export function selectProjectByCode(data: WorkspaceData, code: string): Project | undefined {
  return data.projects.find((project) => project.code === code);
}

export function selectProjectsByCode(data: WorkspaceData, code: string): Project[] {
  const marker = code.trim().toLocaleUpperCase("en-US");
  if (!marker) return [];
  return data.projects.filter((project) => project.code.toLocaleUpperCase("en-US").includes(marker));
}

export function selectOpenIssues(data: WorkspaceData, projectId?: string) {
  return data.technicalIssues.filter((issue) => issue.status !== "已解决" && issue.status !== "不处理" && (!projectId || issue.projectId === projectId));
}

export function selectCalendarEventsForProject(events: CalendarEvent[], data: WorkspaceData,
  projectId: string, reflections: Review[] = []): CalendarEvent[] {
  if (!projectId) return events;
  const taskIds = new Set(data.tasks.filter((item) => item.projectId === projectId).map((item) => item.id));
  const milestoneIds = new Set(data.projectMilestones.filter((item) => item.projectId === projectId).map((item) => item.id));
  const reflectionIds = new Set(reflections.filter((item) => item.relatedProjectId === projectId).map((item) => item.id));
  const engineeringLogIds = new Set(data.workLogs.filter((item) => item.projectId === projectId).map((item) => item.id));
  return events.filter((event) => event.sourceId && (
    event.sourceType === "task" && taskIds.has(event.sourceId) ||
    event.sourceType === "milestone" && milestoneIds.has(event.sourceId) ||
    event.sourceType === "reflection" && reflectionIds.has(event.sourceId) ||
    event.sourceType === "engineeringLog" && engineeringLogIds.has(event.sourceId)
  ));
}

export function selectDerivedCalendarEvents(data: WorkspaceData, reflections: Review[] = []): CalendarEvent[] {
  const epoch = "1970-01-01T00:00:00.000Z";
  const events = [
    ...data.calendarEvents.filter((event) => event.sourceType === "manual"),
    ...data.workLogs.filter((log) => /^\d{4}-\d{2}-\d{2}$/.test(log.date)).map((log): CalendarEvent => ({
      id: `derived-engineering-log-${log.id}`, title: log.title, eventType: "研发",
      startAt: `${log.date}T12:00:00+08:00`, endAt: `${log.date}T12:00:00+08:00`,
      allDay: true, sourceType: "engineeringLog", sourceId: log.id, colorKey: "blue",
      notes: log.workContent, createdAt: log.createdAt, updatedAt: log.updatedAt,
    })),
    ...data.tasks.map((task): CalendarEvent => ({ id: `derived-task-${task.id}`, title: task.title, eventType: "任务", startAt: task.dueAt, endAt: task.dueAt, allDay: false, sourceType: "task", sourceId: task.id, colorKey: "blue", notes: task.description, createdAt: task.createdAt, updatedAt: task.updatedAt })),
    ...data.studyPlans.map((plan): CalendarEvent => ({ id: `derived-study-${plan.id}`, title: `学习截止：${plan.title}`, eventType: "学习", startAt: `${plan.deadline}T23:59:00`, endAt: `${plan.deadline}T23:59:00`, allDay: true, sourceType: "studyPlan", sourceId: plan.id, colorKey: "green", notes: plan.nextAction, createdAt: plan.createdAt, updatedAt: plan.updatedAt })),
    ...data.readingItems.map((item): CalendarEvent => ({ id: `derived-reading-${item.id}`, title: `阅读截止：${item.title}`, eventType: "阅读", startAt: `${item.targetDate}T23:59:00`, endAt: `${item.targetDate}T23:59:00`, allDay: true, sourceType: "reading", sourceId: item.id, colorKey: "amber", notes: item.notes, createdAt: item.createdAt, updatedAt: item.updatedAt })),
    ...data.projectMilestones.map((item): CalendarEvent => ({ id: `derived-milestone-${item.id}`, title: `里程碑：${item.title}`, eventType: "项目", startAt: `${item.targetDate}T23:59:00`, endAt: `${item.targetDate}T23:59:00`, allDay: true, sourceType: "milestone", sourceId: item.id, colorKey: "violet", notes: item.description, createdAt: epoch, updatedAt: epoch })),
    ...reflections.map((item): CalendarEvent => {
      const { end } = reflectionPeriod(item.type, item.date);
      return { id: `derived-reflection-${item.id}`, title: `${reflectionTypeLabels[item.type]}：${item.summary}`,
        eventType: "总结", startAt: `${end}T12:00:00+08:00`, endAt: `${end}T12:00:00+08:00`,
        allDay: true, sourceType: "reflection", sourceId: item.id, colorKey: "violet",
        notes: `${reflectionPeriodLabel(item.type, item.date)}\n${reflectionBody(item)}`,
        createdAt: epoch, updatedAt: epoch };
    }),
  ];

  const seen = new Set<string>();
  return events.filter((event) => {
    const key = event.sourceType === "manual"
      ? `manual:${event.id}`
      : event.sourceId
        ? `${event.sourceType}:${event.sourceId}`
        : "";
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
