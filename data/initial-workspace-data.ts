import { createInitialEngineeringData, ROBOMASTER_PROJECT_ID } from "@/data/initial-engineering-data";
import { createInitialGrowthData } from "@/data/initial-growth-data";
import { createInitialPersonalData } from "@/data/initial-personal-data";
import { localDateKeyWithOffset, localDateTimeWithOffset } from "@/lib/date";
import type { StudyPlan, StudySession } from "@/types/learning";
import type { ReadingItem } from "@/types/reading";
import type { Task } from "@/types/task";
import { WORKSPACE_SCHEMA_VERSION, type WorkspaceData } from "@/types/workspace";

function createInitialTasks(now: Date): Task[] {
  const timestamp = now.toISOString();
  return [
    { id: "task-math", title: "完成高等数学作业", description: "完成第三章课后习题并标记不会的题目。", status: "进行中", priority: "高", domain: "学校学习", scheduledDate: localDateKeyWithOffset(now, 0), dueAt: localDateTimeWithOffset(now, 0, "19:00"), estimateHours: 1.5, actualHours: 0.5, tags: ["高等数学", "作业"], sourceType: "manual", createdAt: timestamp, updatedAt: timestamp },
    { id: "task-reading", title: "阅读《控制系统基础》20 页", description: "阅读经典控制章节并记录三个关键概念。", status: "待开始", priority: "中", domain: "阅读成长", scheduledDate: localDateKeyWithOffset(now, 0), dueAt: localDateTimeWithOffset(now, 0, "21:00"), estimateHours: 0.8, actualHours: 0, tags: ["控制理论", "阅读"], sourceType: "reading", sourceId: "book-control", createdAt: timestamp, updatedAt: timestamp },
    { id: "task-motor", title: "调试步兵底盘电机速度环", description: "完成 M3508 带载速度环测试并记录超调与稳态误差。", status: "进行中", priority: "高", domain: "项目研发", scheduledDate: localDateKeyWithOffset(now, 0), dueAt: localDateTimeWithOffset(now, 0, "22:00"), estimateHours: 2, actualHours: 0.6, tags: ["M3508", "PID"], projectId: ROBOMASTER_PROJECT_ID, moduleId: "module-motor", sourceType: "project", sourceId: ROBOMASTER_PROJECT_ID, createdAt: timestamp, updatedAt: timestamp },
    { id: "task-supercap", title: "整理超级电容通信记录", description: "整理 CAN 帧定义、功率状态与异常现象。", status: "待开始", priority: "中", domain: "项目研发", scheduledDate: localDateKeyWithOffset(now, 1), dueAt: localDateTimeWithOffset(now, 1, "12:00"), estimateHours: 0.7, actualHours: 0, tags: ["超级电容", "CAN"], projectId: ROBOMASTER_PROJECT_ID, moduleId: "module-supercap", sourceType: "project", sourceId: ROBOMASTER_PROJECT_ID, createdAt: timestamp, updatedAt: timestamp },
    { id: "task-video", title: "查看一条 RoboMaster 技术视频", description: "选择一条与底盘控制相关的视频并输出简短笔记。", status: "待开始", priority: "低", domain: "内容学习", scheduledDate: localDateKeyWithOffset(now, 1), dueAt: localDateTimeWithOffset(now, 1, "20:00"), estimateHours: 0.5, actualHours: 0, tags: ["技术视频", "RoboMaster"], sourceType: "manual", createdAt: timestamp, updatedAt: timestamp },
  ];
}

function createInitialStudyPlans(now: Date): StudyPlan[] {
  const timestamp = now.toISOString();
  const definitions: Array<[string, string, StudyPlan["category"], number, number, number, string, string[]]> = [
    ["plan-math", "高等数学", "课程", 50, 18, 21, "完成第三章习题并整理错题", ["数学", "课程"]],
    ["plan-circuit", "电路分析", "课程", 36, 12, 30, "复习戴维南定理并完成例题", ["电路", "课程"]],
    ["plan-cpp", "C / C++ 工程能力", "技术", 60, 22, 60, "练习 RAII 与模块化设计", ["C++", "编程"]],
    ["plan-stm32", "STM32 外设与调度", "技术", 48, 19, 45, "整理 CAN 与定时器配置清单", ["STM32", "嵌入式"]],
    ["plan-control", "控制系统基础", "考试", 42, 11.5, 28, "完成经典控制章节阅读", ["控制", "考试"]],
    ["plan-chassis", "RoboMaster 底盘控制", "项目", 80, 31, 40, "完成速度环带载复测", ["RoboMaster", "底盘"]],
    ["plan-python", "Python 数据处理", "阶段目标", 30, 8, 75, "分析一组电机测试 CSV", ["Python", "数据"]],
  ];
  return definitions.map(([id, title, category, targetHours, completedHours, deadlineOffset, nextAction, tags]) => ({
    id,
    title,
    category,
    description: `${title}的演示阶段学习计划。`,
    targetHours,
    completedHours,
    progress: Math.min(100, Math.round((completedHours / targetHours) * 100)),
    deadline: localDateKeyWithOffset(now, deadlineOffset),
    nextAction,
    status: "进行中",
    tags,
    createdAt: localDateTimeWithOffset(now, -20, "09:00"),
    updatedAt: timestamp,
  }));
}

function createInitialStudySessions(now: Date): StudySession[] {
  return [
    { id: "session-control-1", studyPlanId: "plan-control", date: localDateKeyWithOffset(now, 0), durationMinutes: 90, content: "经典控制系统基本结构", result: "完成章节笔记", notes: "需要复习稳态误差定义。", createdAt: localDateTimeWithOffset(now, 0, "10:00") },
    { id: "session-chassis-1", studyPlanId: "plan-chassis", date: localDateKeyWithOffset(now, -1), durationMinutes: 120, content: "M3508 速度环参数测试", result: "获得第一组带载数据", notes: "换向时仍有明显振荡。", createdAt: localDateTimeWithOffset(now, -1, "21:00") },
    { id: "session-math-1", studyPlanId: "plan-math", date: localDateKeyWithOffset(now, -2), durationMinutes: 75, content: "高数第三章复习", result: "完成 12 道习题", notes: "两道积分题需要订正。", createdAt: localDateTimeWithOffset(now, -2, "20:30") },
  ];
}

function createInitialReadingItems(now: Date): ReadingItem[] {
  const timestamp = now.toISOString();
  const definitions: Array<[string, string, string, ReadingItem["category"], number, number, number, number]> = [
    ["book-control", "控制系统基础", "课程推荐读物", "课程教材", 320, 86, 20, 30],
    ["book-cpp", "C++ Primer", "演示书目", "专业技术", 864, 120, 15, 90],
    ["book-embedded", "嵌入式系统设计", "演示书目", "专业技术", 420, 35, 12, 70],
    ["book-product", "产品方法与用户研究", "演示书目", "产品管理", 260, 0, 10, 80],
    ["book-startup", "创业项目从零到一", "演示书目", "创业商业", 280, 0, 10, 110],
  ];
  return definitions.map(([id, title, author, category, totalPages, currentPage, dailyPageTarget, targetOffset]) => ({
    id,
    title,
    author,
    category,
    totalPages,
    currentPage,
    dailyPageTarget,
    startDate: localDateKeyWithOffset(now, 0),
    targetDate: localDateKeyWithOffset(now, targetOffset),
    status: currentPage > 0 ? "阅读中" : "待读",
    rating: 0,
    notes: "",
    tags: [category],
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
}

export function createEmptyWorkspaceData(): WorkspaceData {
  const epoch = "1970-01-01T00:00:00.000Z";
  return {
    tasks: [], studyPlans: [], studySessions: [], readingItems: [], projects: [], projectModules: [],
    projectMilestones: [], workLogs: [], testRecords: [], technicalIssues: [], issueSolutions: [],
    knowledgeItems: [], skills: [], skillEvidence: [], reports: [], resumeMaterials: [], calendarEvents: [],
    financeTransactions: [], metadata: { schemaVersion: WORKSPACE_SCHEMA_VERSION, createdAt: epoch, updatedAt: epoch },
  };
}

export function createInitialWorkspaceData(now = new Date()): WorkspaceData {
  const engineering = createInitialEngineeringData(now);
  const growth = createInitialGrowthData(now);
  const personal = createInitialPersonalData(now);
  const timestamp = now.toISOString();
  return {
    tasks: createInitialTasks(now),
    studyPlans: createInitialStudyPlans(now),
    studySessions: createInitialStudySessions(now),
    readingItems: createInitialReadingItems(now),
    ...engineering,
    ...growth,
    ...personal,
    metadata: { schemaVersion: WORKSPACE_SCHEMA_VERSION, createdAt: timestamp, updatedAt: timestamp },
  };
}

export const initialWorkspaceData = createInitialWorkspaceData();
export const initialTasks = initialWorkspaceData.tasks;
