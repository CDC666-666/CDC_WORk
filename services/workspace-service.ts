import type { CalendarEvent } from "@/types/calendar";
import type { WorkLog } from "@/types/engineering-log";
import type { FinanceTransaction } from "@/types/finance";
import type { KnowledgeItem } from "@/types/knowledge";
import type { StudyPlan, StudySession } from "@/types/learning";
import type { Project, ProjectMilestone, ProjectModule } from "@/types/project";
import type { ReadingItem } from "@/types/reading";
import type { ReportRecord } from "@/types/report";
import type { ResumeMaterial } from "@/types/resume";
import type { Skill, SkillEvidence } from "@/types/skill";
import type { Task } from "@/types/task";
import type { IssueSolution, TechnicalIssue, TestRecord } from "@/types/testing";
import type { WorkspaceData } from "@/types/workspace";

export type WorkspaceAction =
  | { type: "workspace/replaced"; data: WorkspaceData }
  | { type: "task/added"; task: Task }
  | { type: "task/updated"; task: Task }
  | { type: "task/deleted"; taskId: string }
  | { type: "study-plan/added"; plan: StudyPlan }
  | { type: "study-plan/updated"; plan: StudyPlan }
  | { type: "study-plan/deleted"; planId: string }
  | { type: "study-session/added"; session: StudySession }
  | { type: "reading/added"; item: ReadingItem }
  | { type: "reading/updated"; item: ReadingItem }
  | { type: "reading/deleted"; itemId: string }
  | { type: "project/added"; project: Project }
  | { type: "project/updated"; project: Project }
  | { type: "project/deleted"; projectId: string }
  | { type: "project-module/added"; module: ProjectModule }
  | { type: "project-module/updated"; module: ProjectModule }
  | { type: "project-module/deleted"; moduleId: string }
  | { type: "milestone/added"; milestone: ProjectMilestone }
  | { type: "milestone/updated"; milestone: ProjectMilestone }
  | { type: "milestone/deleted"; milestoneId: string }
  | { type: "work-log/added"; workLog: WorkLog }
  | { type: "work-log/updated"; workLog: WorkLog }
  | { type: "work-log/deleted"; workLogId: string }
  | { type: "test/added"; testRecord: TestRecord }
  | { type: "test/updated"; testRecord: TestRecord }
  | { type: "test/deleted"; testRecordId: string }
  | { type: "issue/added"; issue: TechnicalIssue }
  | { type: "issue/updated"; issue: TechnicalIssue }
  | { type: "issue/deleted"; issueId: string }
  | { type: "solution/added"; solution: IssueSolution }
  | { type: "solution/updated"; solution: IssueSolution }
  | { type: "solution/deleted"; solutionId: string }
  | { type: "knowledge/added"; item: KnowledgeItem }
  | { type: "knowledge/updated"; item: KnowledgeItem }
  | { type: "knowledge/deleted"; itemId: string }
  | { type: "skill/added"; skill: Skill }
  | { type: "skill/updated"; skill: Skill }
  | { type: "skill/deleted"; skillId: string }
  | { type: "skill-evidence/added"; evidence: SkillEvidence }
  | { type: "skill-evidence/deleted"; evidenceId: string }
  | { type: "report/added"; report: ReportRecord }
  | { type: "report/updated"; report: ReportRecord }
  | { type: "report/deleted"; reportId: string }
  | { type: "resume/added"; material: ResumeMaterial }
  | { type: "resume/updated"; material: ResumeMaterial }
  | { type: "resume/deleted"; materialId: string }
  | { type: "calendar/added"; event: CalendarEvent }
  | { type: "calendar/updated"; event: CalendarEvent }
  | { type: "calendar/deleted"; eventId: string }
  | { type: "finance/added"; transaction: FinanceTransaction }
  | { type: "finance/updated"; transaction: FinanceTransaction }
  | { type: "finance/deleted"; transactionId: string };

function withUpdatedMetadata(data: WorkspaceData, updatedAt: string): WorkspaceData {
  return { ...data, metadata: { ...data.metadata, updatedAt } };
}

export function workspaceReducer(data: WorkspaceData, action: WorkspaceAction): WorkspaceData {
  const now = new Date().toISOString();
  switch (action.type) {
    case "workspace/replaced":
      return action.data;
    case "task/added":
      return withUpdatedMetadata({ ...data, tasks: [action.task, ...data.tasks] }, now);
    case "task/updated":
      return withUpdatedMetadata(
        { ...data, tasks: data.tasks.map((task) => (task.id === action.task.id ? action.task : task)) },
        now,
      );
    case "task/deleted":
      return withUpdatedMetadata(
        { ...data, tasks: data.tasks.filter((task) => task.id !== action.taskId) },
        now,
      );
    case "study-plan/added":
      return withUpdatedMetadata({ ...data, studyPlans: [action.plan, ...data.studyPlans] }, now);
    case "study-plan/updated":
      return withUpdatedMetadata(
        { ...data, studyPlans: data.studyPlans.map((plan) => (plan.id === action.plan.id ? action.plan : plan)) },
        now,
      );
    case "study-plan/deleted":
      return withUpdatedMetadata(
        {
          ...data,
          studyPlans: data.studyPlans.filter((plan) => plan.id !== action.planId),
          studySessions: data.studySessions.filter((session) => session.studyPlanId !== action.planId),
        },
        now,
      );
    case "study-session/added": {
      const addedHours = action.session.durationMinutes / 60;
      return withUpdatedMetadata(
        {
          ...data,
          studySessions: [action.session, ...data.studySessions],
          studyPlans: data.studyPlans.map((plan) => {
            if (plan.id !== action.session.studyPlanId) return plan;
            const completedHours = Math.round((plan.completedHours + addedHours) * 100) / 100;
            const progress = Math.min(100, Math.round((completedHours / Math.max(plan.targetHours, 0.1)) * 100));
            return {
              ...plan,
              completedHours,
              progress,
              status: progress >= 100 ? "已完成" : "进行中",
              updatedAt: now,
            };
          }),
        },
        now,
      );
    }
    case "reading/added":
      return withUpdatedMetadata({ ...data, readingItems: [action.item, ...data.readingItems] }, now);
    case "reading/updated":
      return withUpdatedMetadata(
        { ...data, readingItems: data.readingItems.map((item) => (item.id === action.item.id ? action.item : item)) },
        now,
      );
    case "reading/deleted":
      return withUpdatedMetadata(
        { ...data, readingItems: data.readingItems.filter((item) => item.id !== action.itemId) },
        now,
      );
    case "project/added":
      return withUpdatedMetadata({ ...data, projects: [action.project, ...data.projects] }, now);
    case "project/updated":
      return withUpdatedMetadata({ ...data, projects: data.projects.map((item) => item.id === action.project.id ? action.project : item) }, now);
    case "project/deleted": {
      const issueIds = new Set(data.technicalIssues.filter((item) => item.projectId === action.projectId).map((item) => item.id));
      return withUpdatedMetadata({
        ...data,
        projects: data.projects.filter((item) => item.id !== action.projectId),
        projectModules: data.projectModules.filter((item) => item.projectId !== action.projectId),
        projectMilestones: data.projectMilestones.filter((item) => item.projectId !== action.projectId),
        tasks: data.tasks.filter((item) => item.projectId !== action.projectId),
        workLogs: data.workLogs.filter((item) => item.projectId !== action.projectId),
        testRecords: data.testRecords.filter((item) => item.projectId !== action.projectId),
        technicalIssues: data.technicalIssues.filter((item) => item.projectId !== action.projectId),
        issueSolutions: data.issueSolutions.filter((item) => !issueIds.has(item.issueId)),
        knowledgeItems: data.knowledgeItems.filter((item) => item.projectId !== action.projectId),
        reports: data.reports.filter((item) => item.projectId !== action.projectId),
        resumeMaterials: data.resumeMaterials.filter((item) => item.projectId !== action.projectId),
        skillEvidence: data.skillEvidence.map((item) => item.projectId === action.projectId ? { ...item, projectId: undefined } : item),
      }, now);
    }
    case "project-module/added":
      return withUpdatedMetadata({ ...data, projectModules: [...data.projectModules, action.module] }, now);
    case "project-module/updated":
      return withUpdatedMetadata({ ...data, projectModules: data.projectModules.map((item) => item.id === action.module.id ? action.module : item) }, now);
    case "project-module/deleted":
      return withUpdatedMetadata({
        ...data,
        projectModules: data.projectModules.filter((item) => item.id !== action.moduleId),
        tasks: data.tasks.map((item) => item.moduleId === action.moduleId ? { ...item, moduleId: undefined } : item),
        workLogs: data.workLogs.map((item) => item.moduleId === action.moduleId ? { ...item, moduleId: undefined } : item),
        testRecords: data.testRecords.map((item) => item.moduleId === action.moduleId ? { ...item, moduleId: undefined } : item),
        technicalIssues: data.technicalIssues.map((item) => item.moduleId === action.moduleId ? { ...item, moduleId: undefined } : item),
        knowledgeItems: data.knowledgeItems.map((item) => item.moduleId === action.moduleId ? { ...item, moduleId: undefined } : item),
      }, now);
    case "milestone/added":
      return withUpdatedMetadata({ ...data, projectMilestones: [action.milestone, ...data.projectMilestones] }, now);
    case "milestone/updated":
      return withUpdatedMetadata({ ...data, projectMilestones: data.projectMilestones.map((item) => item.id === action.milestone.id ? action.milestone : item) }, now);
    case "milestone/deleted":
      return withUpdatedMetadata({ ...data, projectMilestones: data.projectMilestones.filter((item) => item.id !== action.milestoneId) }, now);
    case "work-log/added":
      return withUpdatedMetadata({ ...data, workLogs: [action.workLog, ...data.workLogs] }, now);
    case "work-log/updated":
      return withUpdatedMetadata({ ...data, workLogs: data.workLogs.map((item) => item.id === action.workLog.id ? action.workLog : item) }, now);
    case "work-log/deleted":
      return withUpdatedMetadata({
        ...data,
        workLogs: data.workLogs.filter((item) => item.id !== action.workLogId),
        testRecords: data.testRecords.map((item) => item.workLogId === action.workLogId ? { ...item, workLogId: undefined } : item),
        knowledgeItems: data.knowledgeItems.map((item) => item.sourceType === "workLog" && item.sourceId === action.workLogId ? { ...item, sourceId: undefined } : item),
      }, now);
    case "test/added":
      return withUpdatedMetadata({ ...data, testRecords: [action.testRecord, ...data.testRecords] }, now);
    case "test/updated":
      return withUpdatedMetadata({ ...data, testRecords: data.testRecords.map((item) => item.id === action.testRecord.id ? action.testRecord : item) }, now);
    case "test/deleted":
      return withUpdatedMetadata({
        ...data,
        testRecords: data.testRecords.filter((item) => item.id !== action.testRecordId),
        technicalIssues: data.technicalIssues.map((item) => item.testRecordId === action.testRecordId ? { ...item, testRecordId: undefined } : item),
        knowledgeItems: data.knowledgeItems.map((item) => item.sourceType === "test" && item.sourceId === action.testRecordId ? { ...item, sourceId: undefined } : item),
      }, now);
    case "issue/added":
      return withUpdatedMetadata({ ...data, technicalIssues: [action.issue, ...data.technicalIssues] }, now);
    case "issue/updated":
      return withUpdatedMetadata({ ...data, technicalIssues: data.technicalIssues.map((item) => item.id === action.issue.id ? action.issue : item) }, now);
    case "issue/deleted":
      return withUpdatedMetadata({
        ...data,
        technicalIssues: data.technicalIssues.filter((item) => item.id !== action.issueId),
        issueSolutions: data.issueSolutions.filter((item) => item.issueId !== action.issueId),
        knowledgeItems: data.knowledgeItems.map((item) => item.sourceType === "issue" && item.sourceId === action.issueId ? { ...item, sourceId: undefined } : item),
      }, now);
    case "solution/added":
      return withUpdatedMetadata({ ...data, issueSolutions: [action.solution, ...data.issueSolutions] }, now);
    case "solution/updated":
      return withUpdatedMetadata({ ...data, issueSolutions: data.issueSolutions.map((item) => item.id === action.solution.id ? action.solution : item) }, now);
    case "solution/deleted":
      return withUpdatedMetadata({ ...data, issueSolutions: data.issueSolutions.filter((item) => item.id !== action.solutionId) }, now);
    case "knowledge/added":
      return withUpdatedMetadata({ ...data, knowledgeItems: [action.item, ...data.knowledgeItems] }, now);
    case "knowledge/updated":
      return withUpdatedMetadata({ ...data, knowledgeItems: data.knowledgeItems.map((item) => item.id === action.item.id ? action.item : item) }, now);
    case "knowledge/deleted":
      return withUpdatedMetadata({ ...data, knowledgeItems: data.knowledgeItems.filter((item) => item.id !== action.itemId) }, now);
    case "skill/added":
      return withUpdatedMetadata({ ...data, skills: [action.skill, ...data.skills] }, now);
    case "skill/updated":
      return withUpdatedMetadata({ ...data, skills: data.skills.map((item) => item.id === action.skill.id ? action.skill : item) }, now);
    case "skill/deleted":
      return withUpdatedMetadata({ ...data, skills: data.skills.filter((item) => item.id !== action.skillId), skillEvidence: data.skillEvidence.filter((item) => item.skillId !== action.skillId) }, now);
    case "skill-evidence/added":
      return withUpdatedMetadata({ ...data, skillEvidence: [action.evidence, ...data.skillEvidence] }, now);
    case "skill-evidence/deleted":
      return withUpdatedMetadata({ ...data, skillEvidence: data.skillEvidence.filter((item) => item.id !== action.evidenceId) }, now);
    case "report/added":
      return withUpdatedMetadata({ ...data, reports: [action.report, ...data.reports] }, now);
    case "report/updated":
      return withUpdatedMetadata({ ...data, reports: data.reports.map((item) => item.id === action.report.id ? action.report : item) }, now);
    case "report/deleted":
      return withUpdatedMetadata({ ...data, reports: data.reports.filter((item) => item.id !== action.reportId) }, now);
    case "resume/added":
      return withUpdatedMetadata({ ...data, resumeMaterials: [action.material, ...data.resumeMaterials] }, now);
    case "resume/updated":
      return withUpdatedMetadata({ ...data, resumeMaterials: data.resumeMaterials.map((item) => item.id === action.material.id ? action.material : item) }, now);
    case "resume/deleted":
      return withUpdatedMetadata({ ...data, resumeMaterials: data.resumeMaterials.filter((item) => item.id !== action.materialId) }, now);
    case "calendar/added":
      return withUpdatedMetadata({ ...data, calendarEvents: [action.event, ...data.calendarEvents] }, now);
    case "calendar/updated":
      return withUpdatedMetadata({ ...data, calendarEvents: data.calendarEvents.map((item) => item.id === action.event.id ? action.event : item) }, now);
    case "calendar/deleted":
      return withUpdatedMetadata({ ...data, calendarEvents: data.calendarEvents.filter((item) => item.id !== action.eventId) }, now);
    case "finance/added":
      return withUpdatedMetadata({ ...data, financeTransactions: [action.transaction, ...data.financeTransactions] }, now);
    case "finance/updated":
      return withUpdatedMetadata({ ...data, financeTransactions: data.financeTransactions.map((item) => item.id === action.transaction.id ? action.transaction : item) }, now);
    case "finance/deleted":
      return withUpdatedMetadata({ ...data, financeTransactions: data.financeTransactions.filter((item) => item.id !== action.transactionId) }, now);
  }
}

export function createWorkspaceId(prefix: string): string {
  const suffix = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${suffix}`;
}

