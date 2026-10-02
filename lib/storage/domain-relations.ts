import type { WorkspaceDomainState } from "@/types/workspace";

/** Human-readable references shared by old-page saves and domain services. */
export function projectReferences(state: WorkspaceDomainState, id: string): string[] {
  const checks: [string, boolean][] = [
    ["任务", state.tasks.some((item) => item.sourceType === "PROJECT" && item.relatedId === id)],
    ["工程日志", state.engineeringLogs.some((item) => item.projectId === id)],
    ["实验", state.experiments.some((item) => item.projectId === id)],
    ["项目模块", state.projectModules.some((item) => item.projectId === id)],
    ["里程碑", state.projectMilestones.some((item) => item.projectId === id)],
    ["知识", state.knowledge.some((item) => item.projectId === id)],
    ["复盘", state.reviews.some((item) => item.relatedProjectId === id)],
    ["时间线", state.timeline.some((item) => item.relatedProjectId === id)],
    ["技能证据", state.skillEvidence.some((item) => item.projectId === id)],
    ["附件", state.attachments.some((item) => item.relatedType === "PROJECT" && item.relatedId === id)],
    ["技术问题", state.legacy.technicalIssues.some((item) => item.projectId === id)],
    ["报告", state.legacy.reports.some((item) => item.projectId === id)],
    ["简历素材", state.legacy.resumeMaterials.some((item) => item.projectId === id)],
  ];
  return checks.filter(([, found]) => found).map(([label]) => label);
}

export function assertProjectDeletionAllowed(state: WorkspaceDomainState, id: string): void {
  const references = projectReferences(state, id);
  if (references.length) throw new Error(`项目仍有关联记录（${references.join("、")}），请先处理关联数据后再删除。`);
}

/** Keep invalid legacy references intact and report them instead of silently dropping records. */
export function findBrokenDomainReferences(state: WorkspaceDomainState): string[] {
  const issues: string[] = [];
  const projects = new Set(state.projects.map((item) => item.id));
  const semesters = new Set(state.academic.semesters.map((item) => item.id));
  const courses = new Set(state.academic.courses.map((item) => item.id));
  const entities: Record<string, Set<string>> = {
    PROJECT: projects,
    ENGINEERING_LOG: new Set(state.engineeringLogs.map((item) => item.id)),
    KNOWLEDGE: new Set(state.knowledge.map((item) => item.id)),
    REVIEW: new Set(state.reviews.map((item) => item.id)),
    COURSE: courses,
    ASSIGNMENT: new Set(state.academic.assignments.map((item) => item.id)),
    EXPERIMENT: new Set(state.experiments.map((item) => item.id)),
  };
  const checkProject = (kind: string, id: string, projectId?: string) => {
    if (projectId && !projects.has(projectId)) issues.push(`${kind} ${id} 指向不存在的项目 ${projectId}`);
  };
  for (const item of state.tasks) {
    if (item.sourceType === "PROJECT") checkProject("任务", item.id, item.relatedId);
    if (item.sourceType === "COURSE" && (!item.relatedId || !courses.has(item.relatedId))) {
      issues.push(`任务 ${item.id} 指向不存在的课程 ${item.relatedId ?? "(空)"}`);
    }
  }
  for (const item of state.engineeringLogs) checkProject("工程日志", item.id, item.projectId);
  for (const item of state.experiments) checkProject("实验", item.id, item.projectId);
  for (const item of state.projectModules) checkProject("项目模块", item.id, item.projectId);
  for (const item of state.projectMilestones) checkProject("里程碑", item.id, item.projectId);
  for (const item of state.knowledge) checkProject("知识", item.id, item.projectId);
  for (const item of state.knowledge) {
    if (item.courseId && !courses.has(item.courseId)) issues.push(`知识 ${item.id} 指向不存在的课程 ${item.courseId}`);
  }
  for (const item of state.reviews) {
    checkProject("复盘", item.id, item.relatedProjectId);
    if (item.type === "PROJECT" && !item.relatedProjectId) issues.push(`项目复盘 ${item.id} 缺少关联项目`);
  }
  for (const item of state.timeline) checkProject("时间线", item.id, item.relatedProjectId);
  for (const item of state.skillEvidence) {
    checkProject("技能证据", item.id, item.projectId);
    if (item.courseId && !courses.has(item.courseId)) issues.push(`技能证据 ${item.id} 指向不存在的课程 ${item.courseId}`);
    if (item.knowledgeId && !entities.KNOWLEDGE.has(item.knowledgeId)) {
      issues.push(`技能证据 ${item.id} 指向不存在的知识 ${item.knowledgeId}`);
    }
  }
  for (const item of state.legacy.technicalIssues) checkProject("技术问题", item.id, item.projectId);
  for (const item of state.legacy.reports) checkProject("报告", item.id, item.projectId);
  for (const item of state.legacy.resumeMaterials) checkProject("简历素材", item.id, item.projectId);
  for (const item of state.academic.courses) {
    if (!semesters.has(item.semesterId)) issues.push(`课程 ${item.id} 指向不存在的学期 ${item.semesterId}`);
  }
  for (const [kind, items] of [
    ["章节", state.academic.chapters], ["课时", state.academic.classSessions],
    ["作业", state.academic.assignments], ["考试", state.academic.exams],
  ] as const) {
    for (const item of items) {
      if (!courses.has(item.courseId)) issues.push(`${kind} ${item.id} 指向不存在的课程 ${item.courseId}`);
    }
  }
  for (const item of state.attachments) {
    if (!entities[item.relatedType].has(item.relatedId)) {
      issues.push(`附件 ${item.id} 指向不存在的 ${item.relatedType} ${item.relatedId}`);
    }
  }
  return issues;
}

export function assertDomainReferences(state: WorkspaceDomainState): void {
  const issues = findBrokenDomainReferences(state);
  if (issues.length) throw new Error(`关联引用无效，未保存：${issues.slice(0, 3).join("；")}${issues.length > 3 ? `；另有 ${issues.length - 3} 处` : ""}。`);
}
