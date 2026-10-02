import type { CalendarEvent } from "@/types/calendar";
import type { Assignment } from "@/types/academic";
import type { AcademicState } from "@/types/workspace";

export interface AssignmentView {
  sourceKey: string;
  assignment: Assignment;
  courseName: string;
  isOverdue: boolean;
}

export function isAssignmentOverdue(assignment: Assignment, today: string): boolean {
  return assignment.status !== "COMPLETED" && assignment.deadline.slice(0, 10) < today;
}

/** Due today plus unfinished overdue work; Assignment remains the only stored record. */
export function selectHomeAssignments(state: AcademicState, today: string): AssignmentView[] {
  const courses = new Map(state.courses.map((course) => [course.id, course.name]));
  return state.assignments
    .filter((item) => item.deadline.slice(0, 10) === today || isAssignmentOverdue(item, today))
    .map((assignment) => ({ sourceKey: `assignment:${assignment.id}`, assignment,
      courseName: courses.get(assignment.courseId) ?? "未知课程",
      isOverdue: isAssignmentOverdue(assignment, today) }))
    .sort((left, right) => left.assignment.deadline.localeCompare(right.assignment.deadline));
}

export function selectAssignmentCalendarEvents(state: AcademicState): CalendarEvent[] {
  const courses = new Map(state.courses.map((course) => [course.id, course.name]));
  const epoch = "1970-01-01T00:00:00.000Z";
  return state.assignments.map((assignment) => ({
    id: `derived-assignment-${assignment.id}`,
    title: `作业：${assignment.title}`,
    eventType: "课程",
    startAt: `${assignment.deadline.slice(0, 10)}T23:59:00`,
    endAt: `${assignment.deadline.slice(0, 10)}T23:59:00`,
    allDay: true,
    sourceType: "assignment",
    sourceId: assignment.id,
    colorKey: assignment.status === "COMPLETED" ? "green" : "amber",
    notes: `${courses.get(assignment.courseId) ?? "未知课程"} · ${assignment.description}`,
    createdAt: epoch,
    updatedAt: epoch,
  }));
}
