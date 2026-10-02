/** Academic dates are ISO calendar dates unless a time is explicitly needed. */
export type CourseType = "MAJOR" | "GENERAL";
export type CourseStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED";
export type CourseImportance = 1 | 2 | 3 | 4 | 5;
export type AssignmentStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";
export type AssignmentPriority = "HIGH" | "MEDIUM" | "LOW";
export type ExamType = "QUIZ" | "MIDTERM" | "FINAL" | "OTHER";
export type ExamReviewStatus = "NOT_STARTED" | "IN_PROGRESS" | "READY";

export interface Semester {
  id: string;
  year: number;
  term: string;
  name: string;
}

export interface Course {
  id: string;
  semesterId: string;
  name: string;
  type: CourseType;
  teacher: string;
  credits: number;
  importance: CourseImportance;
  status: CourseStatus;
}

export interface Chapter {
  id: string;
  courseId: string;
  title: string;
  content: string;
  learnDate?: string;
}

export interface ClassSession {
  id: string;
  courseId: string;
  date: string;
  summary: string;
  notes: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  deadline: string;
  status: AssignmentStatus;
  priority: AssignmentPriority;
}

export interface Exam {
  id: string;
  courseId: string;
  date: string;
  type: ExamType;
  reviewStatus: ExamReviewStatus;
}
