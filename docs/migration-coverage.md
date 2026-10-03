# Sprint 5.2A 数据覆盖与迁移边界

## 浏览器键

| 键 | 作用 |
| --- | --- |
| `cdc-workspace-data-v4` | 首选原始 WorkspaceDomainState，含下表 27 个集合 |
| `cdc-workspace-data-v3` | 仅在没有有效 v4 时恢复；与 v4 不叠加 |
| `cdc-workspace-data-v2` | 仅在没有有效 v4/v3 时恢复；只取旧版真实存在的任务、学习计划、学习记录、阅读条目 |
| `cdc-dashboard-task-state-v1` | 旧任务状态恢复原文，作为待人工核对项，不自动叠加 |
| `cdc-workspace-data-v4-invalid-backup` | 旧 Repository 留下的异常原文，保留并提示人工核对 |
| `cdc-content-state-v1` | 独立内容状态、收藏、知识库和学习计划标记 |

工具用浏览器 `getItem` 读取这些原文，不调用会自动修复、归一化或删除键的 Workspace Repository。只有手动点击预览才把原文发给受认证保护的 API。未执行真实浏览器迁移。

## 集合 → Prisma 模型

所有模型均以原实体 ID 为主键，带 `workspaceId`、完整 `payload`、来源哈希、迁移批次和 `relationRefs`；常用筛选字段另存为结构化列。多态关联以 `relationRefs` 保留，并在预检查和事务核对时验证。项目和课程的固定关系另有数据库复合外键，保证同一工作台。

| 来源集合 | 模型 | 重要关系或核对字段 |
| --- | --- | --- |
| projects | Project | 项目本体、日期、可见性 |
| projectModules | ProjectModule | projectId → Project；parentId |
| projectMilestones | ProjectMilestone | projectId → Project；目标日期 |
| tasks | Task | sourceType + relatedId → Project/Course；状态、截止时间 |
| engineeringLogs | EngineeringLog | projectId → Project；moduleId/taskId；日志日期 |
| experiments | Experiment | projectId → Project；moduleId/taskId/workLogId |
| knowledge | Knowledge | projectId/courseId；来源类型和 ID |
| skills | Skill | parentId；等级 |
| skillEvidence | SkillEvidence | skillId/projectId/courseId/knowledgeId；来源 |
| timeline | Timeline | relatedProjectId → Project；日期、可见性 |
| reviews | Review | relatedProjectId → Project；类型、日期、正文 |
| attachments | Attachment | relatedType + relatedId → 对应集合；URL 引用 |
| academic.semesters | Semester | 学年和学期 |
| academic.courses | Course | semesterId → Semester；类型和状态 |
| academic.chapters | Chapter | courseId → Course；学习日期 |
| academic.classSessions | ClassSession | courseId → Course；课堂日期 |
| academic.assignments | Assignment | courseId → Course；状态、截止日期 |
| academic.exams | Exam | courseId → Course；考试日期与复习状态 |
| legacy.studyPlans | StudyPlan | 状态和截止日期 |
| legacy.studySessions | StudySession | studyPlanId → StudyPlan；日期 |
| legacy.readingItems | ReadingItem | 状态和阅读进度 |
| legacy.technicalIssues | TechnicalIssue | projectId/testRecordId；状态 |
| legacy.issueSolutions | IssueSolution | issueId → TechnicalIssue |
| legacy.reports | ReportRecord | projectId；报告状态 |
| legacy.resumeMaterials | ResumeMaterial | projectId；素材状态 |
| legacy.calendarEvents | CalendarEvent | sourceType + sourceId；日程开始时间 |
| legacy.financeTransactions | FinanceTransaction | 金额 Decimal(20,2)、本地日期、收支类型 |
| content.items | ContentState | 状态、收藏、知识库和学习计划标记 |

## 执行与核对

1. 本机读取原文和纯函数预检查。v4 优先；格式错误的 v4 阻止执行，不偷偷降级到旧快照。v3 转换会过滤的派生日历事件单列待处理并保存原文。
2. 服务器预览对 28 个集合分别计算来源、计划写入、跳过、冲突和待处理数。内置演示原样记录默认跳过；演示 ID 被修改时由用户选择；无法安全判断、失效关联、重复或缺失 ID 留在待处理区。
3. 执行以来源指纹、人工选择指纹和实体映射幂等。相同来源重试返回原批次；若数据库内容、版本或结构化字段改变，报告冲突，不覆盖。异常记录进入 MigrationPending，保留完整原文及来源序号。
4. 单个事务内逐项核对完整 JSON、来源哈希、日期、任务和作业状态、金额、内容进度、关联目标及各集合写入数，之后才把批次标记为 COMPLETED 或 PARTIAL。数据库故障回滚实体和映射，批次标记 FAILED 可重试。

本轮不更改工作台页面的数据源，不删除 localStorage 键或设置页备份入口。Sprint 5.2B 接入模块 API 后，仍需完成真实浏览器数据迁移的人工确认，以及服务端备份与恢复。
