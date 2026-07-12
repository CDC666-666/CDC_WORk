import { localDateKeyWithOffset, localDateTimeWithOffset } from "@/lib/date";
import type { WorkLog } from "@/types/engineering-log";
import type { Project, ProjectMilestone, ProjectModule } from "@/types/project";
import type { IssueSolution, TechnicalIssue, TestRecord } from "@/types/testing";

export const ROBOMASTER_PROJECT_ID = "project-rm-standard";
export const WORKSPACE_PROJECT_ID = "project-cdc-workspace";

export interface InitialEngineeringData {
  projects: Project[];
  projectModules: ProjectModule[];
  projectMilestones: ProjectMilestone[];
  workLogs: WorkLog[];
  testRecords: TestRecord[];
  technicalIssues: TechnicalIssue[];
  issueSolutions: IssueSolution[];
}

export function createInitialEngineeringData(now = new Date()): InitialEngineeringData {
  const timestamp = now.toISOString();
  const projectStart = localDateKeyWithOffset(now, -90);
  const projectEnd = localDateKeyWithOffset(now, 120);
  const moduleDefinitions: Array<[string, string, string, number, string]> = [
    ["module-motor", "底盘电机控制", "M3508 双环控制与带载整定", 62, "完成换向工况复测"],
    ["module-can", "CAN 通信", "整车 CAN 设备调度与故障定位", 70, "统一过滤器与帧定义"],
    ["module-supercap", "超级电容", "功率管理与状态通信接入", 48, "完成状态帧联调"],
    ["module-force", "力控底盘", "轮端反馈与底盘响应控制", 36, "建立横移测试基线"],
    ["module-autoaim", "自瞄算法", "坐标解算与电控接口协作", 28, "确认时间戳接口"],
    ["module-integration", "整车联调", "遥控、底盘与视觉链路联调", 42, "完成首轮整车检查"],
    ["module-review", "测试与复盘", "测试记录、问题和方案闭环", 55, "统一复盘模板"],
  ];

  const projects: Project[] = [
    {
      id: ROBOMASTER_PROJECT_ID,
      name: "RoboMaster 全向轮步兵",
      code: "RM-INFANTRY",
      category: "比赛",
      role: "电控负责人",
      description: "演示项目：围绕全向轮步兵底盘、电源与视觉接口建立工程闭环，不代表真实比赛成绩。",
      status: "进行中",
      progress: 46,
      startDate: projectStart,
      endDate: projectEnd,
      objectives: ["完成稳定底盘控制", "接入超级电容", "建立可复现测试与复盘流程"],
      responsibilities: ["电控架构", "底盘控制", "跨模块联调", "测试复盘"],
      techStack: ["STM32", "C/C++", "CAN", "M3508", "RoboMaster C 型开发板"],
      repositoryUrl: "",
      coverStyle: "blue",
      createdAt: localDateTimeWithOffset(now, -90, "09:00"),
      updatedAt: timestamp,
    },
    {
      id: WORKSPACE_PROJECT_ID,
      name: "CDC AI Workspace",
      code: "CDC-WORKSPACE",
      category: "个人",
      role: "产品与开发负责人",
      description: "演示项目：统一管理学习、项目研发、知识和个人成长的数据工作台。",
      status: "进行中",
      progress: 58,
      startDate: localDateKeyWithOffset(now, -45),
      endDate: localDateKeyWithOffset(now, 90),
      objectives: ["形成个人数据闭环", "沉淀工程与成长证据"],
      responsibilities: ["需求拆解", "全栈开发", "质量验收"],
      techStack: ["Next.js", "TypeScript", "React", "Tailwind CSS"],
      repositoryUrl: "https://github.com/CDC666-666/CDC_WORk",
      coverStyle: "green",
      createdAt: localDateTimeWithOffset(now, -45, "09:00"),
      updatedAt: timestamp,
    },
  ];

  const projectModules: ProjectModule[] = moduleDefinitions.map(([id, name, description, progress, currentTarget], index) => ({
    id,
    projectId: ROBOMASTER_PROJECT_ID,
    name,
    description,
    owner: "CDC",
    status: progress >= 65 ? "验证中" : "开发中",
    priority: index < 3 ? "高" : "中",
    progress,
    currentTarget,
    sortOrder: index,
    createdAt: localDateTimeWithOffset(now, -80, "10:00"),
    updatedAt: timestamp,
  }));
  projectModules.push(
    {
      id: "module-workspace-data",
      projectId: WORKSPACE_PROJECT_ID,
      name: "统一数据层",
      description: "Workspace schema、迁移与领域服务",
      owner: "CDC",
      status: "验证中",
      priority: "高",
      progress: 72,
      currentTarget: "完成 schema v3",
      sortOrder: 0,
      createdAt: localDateTimeWithOffset(now, -40, "10:00"),
      updatedAt: timestamp,
    },
    {
      id: "module-workspace-ui",
      projectId: WORKSPACE_PROJECT_ID,
      name: "业务工作台",
      description: "项目、成长与个人管理页面",
      owner: "CDC",
      status: "开发中",
      priority: "高",
      progress: 54,
      currentTarget: "完成工程成长闭环",
      sortOrder: 1,
      createdAt: localDateTimeWithOffset(now, -40, "10:00"),
      updatedAt: timestamp,
    },
  );

  const projectMilestones: ProjectMilestone[] = [
    { id: "milestone-rm-loop", projectId: ROBOMASTER_PROJECT_ID, title: "底盘控制首轮闭环", description: "完成速度环、CAN 与带载测试的可追溯闭环。", targetDate: localDateKeyWithOffset(now, 14), status: "进行中", progress: 64 },
    { id: "milestone-rm-integration", projectId: ROBOMASTER_PROJECT_ID, title: "超级电容与整车联调", description: "完成状态帧、功率限制与整车工况验证。", targetDate: localDateKeyWithOffset(now, 35), status: "未开始", progress: 24 },
    { id: "milestone-workspace-s3", projectId: WORKSPACE_PROJECT_ID, title: "Sprint 3 工程成长闭环", description: "项目、日志、问题、知识和输出数据关联。", targetDate: localDateKeyWithOffset(now, 21), status: "进行中", progress: 36 },
  ];

  const workLogs: WorkLog[] = [
    { id: "log-motor-load", projectId: ROBOMASTER_PROJECT_ID, moduleId: "module-motor", taskId: "task-motor", date: localDateKeyWithOffset(now, 0), title: "M3508 速度环带载测试", workContent: "演示记录：完成三组负载下阶跃测试并记录响应。", result: "获得可对比的速度响应数据。", problems: "换向时仍出现短时振荡。", nextPlan: "降低积分并复测换向工况。", durationMinutes: 95, resultStatus: "部分完成", tags: ["M3508", "PID"], attachments: [], createdAt: localDateTimeWithOffset(now, 0, "10:00"), updatedAt: timestamp },
    { id: "log-supercap-can", projectId: ROBOMASTER_PROJECT_ID, moduleId: "module-supercap", taskId: "task-supercap", date: localDateKeyWithOffset(now, -1), title: "超级电容 CAN 通信整理", workContent: "演示记录：整理状态帧字段和异常码。", result: "完成通信字段清单。", problems: "功率状态刷新周期仍需确认。", nextPlan: "与功率控制逻辑联调。", durationMinutes: 70, resultStatus: "完成", tags: ["超级电容", "CAN"], attachments: [], createdAt: localDateTimeWithOffset(now, -1, "20:00"), updatedAt: timestamp },
    { id: "log-chassis-oscillation", projectId: ROBOMASTER_PROJECT_ID, moduleId: "module-force", date: localDateKeyWithOffset(now, -2), title: "底盘换向振荡排查", workContent: "演示记录：对比限幅、斜坡和积分参数。", result: "确认振荡与积分累积及机械间隙共同相关。", problems: "带载数据量不足。", nextPlan: "补充不同地面工况。", durationMinutes: 110, resultStatus: "部分完成", tags: ["底盘", "振荡"], attachments: [], createdAt: localDateTimeWithOffset(now, -2, "19:30"), updatedAt: timestamp },
    { id: "log-autoaim-coordinate", projectId: ROBOMASTER_PROJECT_ID, moduleId: "module-autoaim", date: localDateKeyWithOffset(now, -3), title: "自瞄坐标解算学习记录", workContent: "演示记录：梳理相机、云台和世界坐标系数据链路。", result: "形成接口字段草案。", problems: "时间同步策略未确定。", nextPlan: "与视觉负责人确认时间戳。", durationMinutes: 80, resultStatus: "完成", tags: ["自瞄", "坐标系"], attachments: [], createdAt: localDateTimeWithOffset(now, -3, "21:00"), updatedAt: timestamp },
  ];

  const testRecords: TestRecord[] = [
    { id: "test-motor-step", projectId: ROBOMASTER_PROJECT_ID, moduleId: "module-motor", taskId: "task-motor", workLogId: "log-motor-load", title: "M3508 带载阶跃响应", testDate: localDateKeyWithOffset(now, 0), environment: "演示台架，轮组离地", objective: "验证速度环带载响应", procedure: "依次施加三档目标转速并记录反馈。", inputParameters: { kp: 8.2, ki: 0.18, targetRpm: 4200 }, measurements: { overshootPercent: 11, settleMs: 310 }, expectedResult: "超调小于 10%，稳定时间小于 300ms", actualResult: "接近目标，换向工况未通过", conclusion: "正向部分通过，需要复测换向。", resultStatus: "部分通过", attachmentNames: [], createdAt: localDateTimeWithOffset(now, 0, "11:30"), updatedAt: timestamp },
    { id: "test-can-frame", projectId: ROBOMASTER_PROJECT_ID, moduleId: "module-can", workLogId: "log-supercap-can", title: "超级电容状态帧连续性", testDate: localDateKeyWithOffset(now, -1), environment: "演示 CAN 总线", objective: "验证状态帧解析稳定性", procedure: "持续接收并统计异常帧。", inputParameters: { bitrate: 1000000, durationSeconds: 120 }, measurements: { frames: 2400, invalidFrames: 0 }, expectedResult: "无无效帧", actualResult: "未发现无效帧", conclusion: "当前解析逻辑通过演示测试。", resultStatus: "通过", attachmentNames: [], createdAt: localDateTimeWithOffset(now, -1, "21:30"), updatedAt: timestamp },
    { id: "test-chassis-reverse", projectId: ROBOMASTER_PROJECT_ID, moduleId: "module-force", workLogId: "log-chassis-oscillation", title: "底盘横移换向复测", testDate: localDateKeyWithOffset(now, -2), environment: "演示室内地面", objective: "验证换向振荡改善", procedure: "执行左右横移和急停。", inputParameters: { rampMs: 180, currentLimit: 12000 }, measurements: { peakErrorPercent: 18 }, expectedResult: "峰值误差小于 12%", actualResult: "峰值误差仍为 18%", conclusion: "失败，需调整积分与斜坡。", resultStatus: "待复测", attachmentNames: [], createdAt: localDateTimeWithOffset(now, -2, "21:00"), updatedAt: timestamp },
  ];

  const technicalIssues: TechnicalIssue[] = [
    { id: "issue-reverse-oscillation", projectId: ROBOMASTER_PROJECT_ID, moduleId: "module-force", taskId: "task-motor", testRecordId: "test-chassis-reverse", title: "底盘换向出现短时振荡", phenomenon: "横移换向后轮速反复修正。", errorMessage: "", severity: "S2", status: "调查中", reproductionSteps: "横移速度达到稳定后快速反向。", probableCause: "积分累积、指令斜坡和机械间隙共同影响。", rootCause: "", discoveredAt: localDateTimeWithOffset(now, -2, "21:10"), createdAt: localDateTimeWithOffset(now, -2, "21:10"), updatedAt: timestamp },
    { id: "issue-supercap-refresh", projectId: ROBOMASTER_PROJECT_ID, moduleId: "module-supercap", testRecordId: "test-can-frame", title: "超级电容功率状态刷新周期不明确", phenomenon: "控制侧无法确认状态值最大延迟。", errorMessage: "", severity: "S3", status: "待定位", reproductionSteps: "切换充放电状态并观察反馈。", probableCause: "协议文档与控制周期尚未统一。", rootCause: "", discoveredAt: localDateTimeWithOffset(now, -1, "22:00"), createdAt: localDateTimeWithOffset(now, -1, "22:00"), updatedAt: timestamp },
    { id: "issue-can-filter", projectId: ROBOMASTER_PROJECT_ID, moduleId: "module-can", title: "CAN 过滤器配置遗漏扩展帧", phenomenon: "特定演示帧无法进入接收回调。", errorMessage: "CAN RX timeout", severity: "S2", status: "已解决", reproductionSteps: "发送扩展帧并检查回调。", probableCause: "过滤器掩码配置错误。", rootCause: "扩展帧 ID 位宽未纳入过滤器掩码。", discoveredAt: localDateTimeWithOffset(now, -8, "18:00"), resolvedAt: localDateTimeWithOffset(now, -6, "20:00"), createdAt: localDateTimeWithOffset(now, -8, "18:00"), updatedAt: timestamp },
  ];

  const issueSolutions: IssueSolution[] = [
    { id: "solution-can-filter", issueId: "issue-can-filter", title: "修正扩展帧过滤器掩码", content: "按 29 位 ID 重新计算过滤器配置，并增加回环测试。", result: "演示帧可稳定进入回调。", isEffective: true, parametersBefore: { idBits: 11 }, parametersAfter: { idBits: 29 }, createdAt: localDateTimeWithOffset(now, -6, "20:00") },
    { id: "solution-reverse-integral", issueId: "issue-reverse-oscillation", title: "降低积分并增加换向清零", content: "降低 ki，检测目标方向变化时限制积分项。", result: "空载振荡减弱，带载待验证。", isEffective: false, parametersBefore: { ki: 0.24 }, parametersAfter: { ki: 0.18 }, createdAt: localDateTimeWithOffset(now, -1, "18:00") },
  ];

  return { projects, projectModules, projectMilestones, workLogs, testRecords, technicalIssues, issueSolutions };
}
