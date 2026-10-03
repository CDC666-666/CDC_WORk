import type { MigrationCollection } from "@/types/migration";

export interface MigrationTable {
  table: string;
  /** Whitelisted SQL columns, each read from the source payload with the same name. */
  fields: readonly string[];
  dateFields?: readonly string[];
}

/** The whitelist is shared by preview, writes, verification, and the coverage document. */
export const MIGRATION_TABLES: Record<MigrationCollection, MigrationTable> = {
  projects: { table: "Project", fields: ["name", "code", "category", "role", "description", "status", "progress",
    "startDate", "endDate", "objectives", "responsibilities", "techStack", "repositoryUrl", "coverStyle",
    "tags", "visibility", "publicSummary"], dateFields: ["startDate", "endDate"] },
  projectModules: { table: "ProjectModule", fields: ["projectId", "parentId", "status"] },
  projectMilestones: { table: "ProjectMilestone", fields: ["projectId", "status", "targetDate"], dateFields: ["targetDate"] },
  tasks: { table: "Task", fields: ["sourceType", "relatedId", "status", "deadline"] },
  engineeringLogs: { table: "EngineeringLog", fields: ["projectId", "moduleId", "taskId", "date"], dateFields: ["date"] },
  experiments: { table: "Experiment", fields: ["projectId", "moduleId", "taskId", "workLogId"] },
  knowledge: { table: "Knowledge", fields: ["projectId", "courseId", "sourceType", "sourceId"] },
  skills: { table: "Skill", fields: ["parentId", "level"] },
  skillEvidence: { table: "SkillEvidence", fields: ["skillId", "projectId", "courseId", "knowledgeId"] },
  timeline: { table: "Timeline", fields: ["relatedProjectId", "date", "visibility"], dateFields: ["date"] },
  reviews: { table: "Review", fields: ["type", "date", "summary", "achievement", "problem", "plan", "relatedProjectId"],
    dateFields: ["date"] },
  attachments: { table: "Attachment", fields: ["url", "type", "relatedType", "relatedId"] },
  semesters: { table: "Semester", fields: ["year", "term"] },
  courses: { table: "Course", fields: ["semesterId", "type", "status"] },
  chapters: { table: "Chapter", fields: ["courseId", "learnDate"], dateFields: ["learnDate"] },
  classSessions: { table: "ClassSession", fields: ["courseId", "date"], dateFields: ["date"] },
  assignments: { table: "Assignment", fields: ["courseId", "deadline", "status"] },
  exams: { table: "Exam", fields: ["courseId", "date", "reviewStatus"], dateFields: ["date"] },
  studyPlans: { table: "StudyPlan", fields: ["status", "deadline"], dateFields: ["deadline"] },
  studySessions: { table: "StudySession", fields: ["studyPlanId", "date"], dateFields: ["date"] },
  readingItems: { table: "ReadingItem", fields: ["status", "currentPage"] },
  technicalIssues: { table: "TechnicalIssue", fields: ["projectId", "testRecordId", "status"] },
  issueSolutions: { table: "IssueSolution", fields: ["issueId", "isEffective"] },
  reports: { table: "ReportRecord", fields: ["projectId", "status"] },
  resumeMaterials: { table: "ResumeMaterial", fields: ["projectId", "status"] },
  calendarEvents: { table: "CalendarEvent", fields: ["sourceType", "sourceId", "startAt"] },
  financeTransactions: { table: "FinanceTransaction", fields: ["amount", "date", "type"], dateFields: ["date"] },
  contentStates: { table: "ContentState", fields: ["status", "isFavorite", "isInKnowledgeBase", "isInStudyPlan"] },
};
