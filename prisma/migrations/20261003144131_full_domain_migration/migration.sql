-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN     "migrationBatchId" TEXT,
ADD COLUMN     "payload" JSONB,
ADD COLUMN     "relationRefs" JSONB,
ADD COLUMN     "sourceHash" TEXT;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "migrationBatchId" TEXT,
ADD COLUMN     "payload" JSONB,
ADD COLUMN     "relationRefs" JSONB,
ADD COLUMN     "sourceHash" TEXT;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "migrationBatchId" TEXT,
ADD COLUMN     "payload" JSONB,
ADD COLUMN     "relationRefs" JSONB,
ADD COLUMN     "sourceHash" TEXT;

-- CreateTable
CREATE TABLE "ProjectModule" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "migrationBatchId" TEXT NOT NULL,
    "relationRefs" JSONB NOT NULL,
    "projectId" TEXT,
    "parentId" TEXT,
    "status" TEXT,

    CONSTRAINT "ProjectModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMilestone" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "migrationBatchId" TEXT NOT NULL,
    "relationRefs" JSONB NOT NULL,
    "projectId" TEXT,
    "status" TEXT,
    "targetDate" DATE,

    CONSTRAINT "ProjectMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "migrationBatchId" TEXT NOT NULL,
    "relationRefs" JSONB NOT NULL,
    "sourceType" TEXT,
    "relatedId" TEXT,
    "status" TEXT,
    "deadline" TEXT,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngineeringLog" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "migrationBatchId" TEXT NOT NULL,
    "relationRefs" JSONB NOT NULL,
    "projectId" TEXT,
    "moduleId" TEXT,
    "taskId" TEXT,
    "date" DATE,

    CONSTRAINT "EngineeringLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experiment" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "migrationBatchId" TEXT NOT NULL,
    "relationRefs" JSONB NOT NULL,
    "projectId" TEXT,
    "moduleId" TEXT,
    "taskId" TEXT,
    "workLogId" TEXT,

    CONSTRAINT "Experiment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Knowledge" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "migrationBatchId" TEXT NOT NULL,
    "relationRefs" JSONB NOT NULL,
    "projectId" TEXT,
    "courseId" TEXT,
    "sourceType" TEXT,
    "sourceId" TEXT,

    CONSTRAINT "Knowledge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "migrationBatchId" TEXT NOT NULL,
    "relationRefs" JSONB NOT NULL,
    "parentId" TEXT,
    "level" INTEGER,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillEvidence" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "migrationBatchId" TEXT NOT NULL,
    "relationRefs" JSONB NOT NULL,
    "skillId" TEXT,
    "projectId" TEXT,
    "courseId" TEXT,
    "knowledgeId" TEXT,

    CONSTRAINT "SkillEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Timeline" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "migrationBatchId" TEXT NOT NULL,
    "relationRefs" JSONB NOT NULL,
    "relatedProjectId" TEXT,
    "date" DATE,
    "visibility" TEXT,

    CONSTRAINT "Timeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Semester" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "migrationBatchId" TEXT NOT NULL,
    "relationRefs" JSONB NOT NULL,
    "year" INTEGER,
    "term" TEXT,

    CONSTRAINT "Semester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "migrationBatchId" TEXT NOT NULL,
    "relationRefs" JSONB NOT NULL,
    "semesterId" TEXT,
    "type" TEXT,
    "status" TEXT,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "migrationBatchId" TEXT NOT NULL,
    "relationRefs" JSONB NOT NULL,
    "courseId" TEXT,
    "learnDate" DATE,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassSession" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "migrationBatchId" TEXT NOT NULL,
    "relationRefs" JSONB NOT NULL,
    "courseId" TEXT,
    "date" DATE,

    CONSTRAINT "ClassSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "migrationBatchId" TEXT NOT NULL,
    "relationRefs" JSONB NOT NULL,
    "courseId" TEXT,
    "deadline" TEXT,
    "status" TEXT,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "migrationBatchId" TEXT NOT NULL,
    "relationRefs" JSONB NOT NULL,
    "courseId" TEXT,
    "date" DATE,
    "reviewStatus" TEXT,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyPlan" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "migrationBatchId" TEXT NOT NULL,
    "relationRefs" JSONB NOT NULL,
    "status" TEXT,
    "deadline" DATE,

    CONSTRAINT "StudyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudySession" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "migrationBatchId" TEXT NOT NULL,
    "relationRefs" JSONB NOT NULL,
    "studyPlanId" TEXT,
    "date" DATE,

    CONSTRAINT "StudySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingItem" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "migrationBatchId" TEXT NOT NULL,
    "relationRefs" JSONB NOT NULL,
    "status" TEXT,
    "currentPage" INTEGER,

    CONSTRAINT "ReadingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnicalIssue" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "migrationBatchId" TEXT NOT NULL,
    "relationRefs" JSONB NOT NULL,
    "projectId" TEXT,
    "testRecordId" TEXT,
    "status" TEXT,

    CONSTRAINT "TechnicalIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IssueSolution" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "migrationBatchId" TEXT NOT NULL,
    "relationRefs" JSONB NOT NULL,
    "issueId" TEXT,
    "isEffective" BOOLEAN,

    CONSTRAINT "IssueSolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportRecord" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "migrationBatchId" TEXT NOT NULL,
    "relationRefs" JSONB NOT NULL,
    "projectId" TEXT,
    "status" TEXT,

    CONSTRAINT "ReportRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeMaterial" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "migrationBatchId" TEXT NOT NULL,
    "relationRefs" JSONB NOT NULL,
    "projectId" TEXT,
    "status" TEXT,

    CONSTRAINT "ResumeMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "migrationBatchId" TEXT NOT NULL,
    "relationRefs" JSONB NOT NULL,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "startAt" TEXT,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceTransaction" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "migrationBatchId" TEXT NOT NULL,
    "relationRefs" JSONB NOT NULL,
    "amount" DECIMAL(20,2),
    "date" DATE,
    "type" TEXT,

    CONSTRAINT "FinanceTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentState" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "migrationBatchId" TEXT NOT NULL,
    "relationRefs" JSONB NOT NULL,
    "status" TEXT,
    "isFavorite" BOOLEAN,
    "isInKnowledgeBase" BOOLEAN,
    "isInStudyPlan" BOOLEAN,

    CONSTRAINT "ContentState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MigrationBatch" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "sourceFingerprint" TEXT NOT NULL,
    "planFingerprint" TEXT NOT NULL,
    "sourceKind" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "rawSource" JSONB NOT NULL,
    "sourceCounts" JSONB NOT NULL,
    "result" JSONB,
    "issues" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MigrationBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MigrationEntityMap" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "collection" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetModel" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "serverVersion" INTEGER,
    "serverUpdatedAt" TIMESTAMP(3),
    "batchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MigrationEntityMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MigrationPending" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "collection" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "reasons" JSONB NOT NULL,

    CONSTRAINT "MigrationPending_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectModule_workspaceId_idx" ON "ProjectModule"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectModule_workspaceId_id_key" ON "ProjectModule"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "ProjectMilestone_workspaceId_idx" ON "ProjectMilestone"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMilestone_workspaceId_id_key" ON "ProjectMilestone"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "Task_workspaceId_idx" ON "Task"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Task_workspaceId_id_key" ON "Task"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "EngineeringLog_workspaceId_idx" ON "EngineeringLog"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "EngineeringLog_workspaceId_id_key" ON "EngineeringLog"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "Experiment_workspaceId_idx" ON "Experiment"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Experiment_workspaceId_id_key" ON "Experiment"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "Knowledge_workspaceId_idx" ON "Knowledge"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Knowledge_workspaceId_id_key" ON "Knowledge"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "Skill_workspaceId_idx" ON "Skill"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_workspaceId_id_key" ON "Skill"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "SkillEvidence_workspaceId_idx" ON "SkillEvidence"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillEvidence_workspaceId_id_key" ON "SkillEvidence"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "Timeline_workspaceId_idx" ON "Timeline"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Timeline_workspaceId_id_key" ON "Timeline"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "Semester_workspaceId_idx" ON "Semester"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Semester_workspaceId_id_key" ON "Semester"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "Course_workspaceId_idx" ON "Course"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Course_workspaceId_id_key" ON "Course"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "Chapter_workspaceId_idx" ON "Chapter"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_workspaceId_id_key" ON "Chapter"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "ClassSession_workspaceId_idx" ON "ClassSession"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSession_workspaceId_id_key" ON "ClassSession"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "Assignment_workspaceId_idx" ON "Assignment"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_workspaceId_id_key" ON "Assignment"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "Exam_workspaceId_idx" ON "Exam"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Exam_workspaceId_id_key" ON "Exam"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "StudyPlan_workspaceId_idx" ON "StudyPlan"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "StudyPlan_workspaceId_id_key" ON "StudyPlan"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "StudySession_workspaceId_idx" ON "StudySession"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "StudySession_workspaceId_id_key" ON "StudySession"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "ReadingItem_workspaceId_idx" ON "ReadingItem"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "ReadingItem_workspaceId_id_key" ON "ReadingItem"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "TechnicalIssue_workspaceId_idx" ON "TechnicalIssue"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "TechnicalIssue_workspaceId_id_key" ON "TechnicalIssue"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "IssueSolution_workspaceId_idx" ON "IssueSolution"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "IssueSolution_workspaceId_id_key" ON "IssueSolution"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "ReportRecord_workspaceId_idx" ON "ReportRecord"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportRecord_workspaceId_id_key" ON "ReportRecord"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "ResumeMaterial_workspaceId_idx" ON "ResumeMaterial"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "ResumeMaterial_workspaceId_id_key" ON "ResumeMaterial"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "CalendarEvent_workspaceId_idx" ON "CalendarEvent"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEvent_workspaceId_id_key" ON "CalendarEvent"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "FinanceTransaction_workspaceId_idx" ON "FinanceTransaction"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceTransaction_workspaceId_id_key" ON "FinanceTransaction"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "ContentState_workspaceId_idx" ON "ContentState"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentState_workspaceId_id_key" ON "ContentState"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "MigrationBatch_workspaceId_status_idx" ON "MigrationBatch"("workspaceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MigrationBatch_workspaceId_sourceFingerprint_planFingerprint_key" ON "MigrationBatch"("workspaceId", "sourceFingerprint", "planFingerprint");

-- CreateIndex
CREATE INDEX "MigrationEntityMap_workspaceId_batchId_idx" ON "MigrationEntityMap"("workspaceId", "batchId");

-- CreateIndex
CREATE UNIQUE INDEX "MigrationEntityMap_workspaceId_collection_sourceId_key" ON "MigrationEntityMap"("workspaceId", "collection", "sourceId");

-- CreateIndex
CREATE INDEX "MigrationPending_workspaceId_collection_idx" ON "MigrationPending"("workspaceId", "collection");

-- CreateIndex
CREATE UNIQUE INDEX "MigrationPending_batchId_collection_sourceId_key" ON "MigrationPending"("batchId", "collection", "sourceId");

-- AddForeignKey
ALTER TABLE "ProjectModule" ADD CONSTRAINT "ProjectModule_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMilestone" ADD CONSTRAINT "ProjectMilestone_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngineeringLog" ADD CONSTRAINT "EngineeringLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experiment" ADD CONSTRAINT "Experiment_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Knowledge" ADD CONSTRAINT "Knowledge_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillEvidence" ADD CONSTRAINT "SkillEvidence_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timeline" ADD CONSTRAINT "Timeline_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Semester" ADD CONSTRAINT "Semester_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyPlan" ADD CONSTRAINT "StudyPlan_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingItem" ADD CONSTRAINT "ReadingItem_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicalIssue" ADD CONSTRAINT "TechnicalIssue_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueSolution" ADD CONSTRAINT "IssueSolution_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportRecord" ADD CONSTRAINT "ReportRecord_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeMaterial" ADD CONSTRAINT "ResumeMaterial_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceTransaction" ADD CONSTRAINT "FinanceTransaction_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentState" ADD CONSTRAINT "ContentState_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MigrationBatch" ADD CONSTRAINT "MigrationBatch_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MigrationEntityMap" ADD CONSTRAINT "MigrationEntityMap_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MigrationPending" ADD CONSTRAINT "MigrationPending_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
