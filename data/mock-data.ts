import type {
  DashboardProject as Project,
  DashboardProjectModule as ProjectModule,
  DashboardSkill as Skill,
  Task,
  DashboardTechnicalIssue as TechnicalIssue,
  UserProfile,
  WeeklyMetric,
  DashboardWorkLog as WorkLog,
} from "@/types";
import { initialTasks } from "@/data/initial-workspace-data";

export const userProfile: UserProfile = {
  id: "usr-cdc-001",
  name: "电控同学",
  initials: "EC",
  grade: "大一",
  role: "电控负责人",
  team: "RoboMaster 校队",
  primaryController: "RoboMaster C 板",
  techStack: ["STM32", "C", "C++", "Python", "Keil 5", "Ubuntu 22.04"],
  focusAreas: ["电机控制", "超级电容", "力控底盘", "自瞄算法", "测试复盘"],
};

export const projects: Project[] = [
  {
    id: "project-standard-2026",
    name: "RoboMaster 全向轮步兵",
    code: "RM-STD-26",
    season: "2026 赛季",
    role: "电控负责人",
    status: "进行中",
    progress: 42,
    description: "围绕 C 板构建稳定底盘控制链路，完成超级电容、力控与自瞄协同联调。",
    moduleIds: ["motor", "supercap", "force-chassis", "auto-aim", "test-review"],
    updatedAt: "2026-07-11T14:30:00+08:00",
  },
];

export const projectModules: ProjectModule[] = [
  {
    id: "motor",
    projectId: "project-standard-2026",
    name: "电机控制",
    shortName: "MOTOR",
    status: "验证中",
    priority: "高",
    progress: 68,
    currentTarget: "M3508 双环参数复测",
    lastUpdated: "今天 14:20",
  },
  {
    id: "supercap",
    projectId: "project-standard-2026",
    name: "超级电容",
    shortName: "SUPERCAP",
    status: "开发中",
    priority: "高",
    progress: 51,
    currentTarget: "CAN 状态帧与功率限幅",
    lastUpdated: "今天 11:40",
  },
  {
    id: "force-chassis",
    projectId: "project-standard-2026",
    name: "力控底盘",
    shortName: "FORCE",
    status: "开发中",
    priority: "高",
    progress: 36,
    currentTarget: "横移跟随误差收敛",
    lastUpdated: "昨天 22:10",
  },
  {
    id: "auto-aim",
    projectId: "project-standard-2026",
    name: "自瞄算法",
    shortName: "AUTO-AIM",
    status: "待规划",
    priority: "中",
    progress: 18,
    currentTarget: "梳理电控联调接口",
    lastUpdated: "07-09 19:30",
  },
  {
    id: "test-review",
    projectId: "project-standard-2026",
    name: "测试复盘",
    shortName: "REVIEW",
    status: "稳定",
    priority: "中",
    progress: 74,
    currentTarget: "统一故障记录模板",
    lastUpdated: "07-10 23:15",
  },
];

export const tasks: Task[] = initialTasks.map((task) => ({ ...task, tags: [...task.tags] }));

export const workLogs: WorkLog[] = [
  {
    id: "log-001",
    projectId: "project-standard-2026",
    moduleId: "motor",
    date: "2026-07-11T14:20:00+08:00",
    title: "M3508 速度环参数初调",
    summary: "完成空载阶跃测试，超调由 18% 降至 9%，仍需带载复测积分项。",
    durationMinutes: 95,
    result: "部分完成",
    tags: ["PID", "M3508"],
  },
  {
    id: "log-002",
    projectId: "project-standard-2026",
    moduleId: "supercap",
    date: "2026-07-10T22:45:00+08:00",
    title: "超级电容通信链路排查",
    summary: "定位状态帧丢包来自过滤器配置，调整后连续运行 40 分钟未复现。",
    durationMinutes: 70,
    result: "完成",
    tags: ["CAN", "故障定位"],
  },
  {
    id: "log-003",
    projectId: "project-standard-2026",
    moduleId: "force-chassis",
    date: "2026-07-09T21:30:00+08:00",
    title: "底盘横移力控联调",
    summary: "低速段跟随稳定，高速换向时出现振荡，已保留波形与测试条件。",
    durationMinutes: 120,
    result: "受阻",
    tags: ["力控", "振荡"],
  },
];

export const technicalIssues: TechnicalIssue[] = [
  {
    id: "issue-001",
    projectId: "project-standard-2026",
    moduleId: "force-chassis",
    title: "高速横移换向出现短时振荡",
    phenomenon: "速度指令反向后 180 ms 内电流环出现两次明显峰值。",
    severity: "S2",
    status: "处理中",
    occurredAt: "2026-07-09T21:05:00+08:00",
  },
  {
    id: "issue-002",
    projectId: "project-standard-2026",
    moduleId: "supercap",
    title: "超级电容状态帧间歇丢失",
    phenomenon: "高总线负载时连续缺失 2 至 3 帧状态数据。",
    rootCause: "C 板 CAN 过滤器掩码配置不完整。",
    solution: "重新配置过滤器并增加接收计数监测。",
    severity: "S2",
    status: "已解决",
    occurredAt: "2026-07-10T21:50:00+08:00",
  },
];

export const skills: Skill[] = [
  {
    id: "skill-stm32",
    name: "STM32 / C 板",
    category: "嵌入式",
    level: 3,
    maxLevel: 5,
    progress: 64,
    trend: 8,
    lastActivity: "今天",
    nextGoal: "独立完成整车 CAN 调度",
  },
  {
    id: "skill-control",
    name: "电机控制",
    category: "控制",
    level: 3,
    maxLevel: 5,
    progress: 58,
    trend: 12,
    lastActivity: "今天",
    nextGoal: "完成带载双环整定",
  },
  {
    id: "skill-python",
    name: "Python 数据分析",
    category: "工具链",
    level: 2,
    maxLevel: 5,
    progress: 43,
    trend: 5,
    lastActivity: "2 天前",
    nextGoal: "自动生成测试曲线",
  },
  {
    id: "skill-vision",
    name: "自瞄算法接口",
    category: "算法",
    level: 1,
    maxLevel: 5,
    progress: 24,
    trend: 3,
    lastActivity: "3 天前",
    nextGoal: "掌握目标预测数据链路",
  },
];

export const weeklyMetrics: WeeklyMetric[] = [
  {
    id: "metric-hours",
    label: "有效开发",
    value: "18.5",
    unit: "小时",
    change: "+3.0h",
    tone: "cyan",
  },
  {
    id: "metric-tasks",
    label: "完成任务",
    value: "12",
    unit: "项",
    change: "完成率 75%",
    tone: "green",
  },
  {
    id: "metric-tests",
    label: "测试轮次",
    value: "8",
    unit: "轮",
    change: "3 组有波形",
    tone: "amber",
  },
  {
    id: "metric-issues",
    label: "闭环问题",
    value: "5",
    unit: "个",
    change: "遗留 1 个",
    tone: "neutral",
  },
];

export const activeProject = projects[0];

export function getModule(moduleId: string) {
  return projectModules.find((module) => module.id === moduleId);
}
