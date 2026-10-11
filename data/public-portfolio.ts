import type { PublicCapability, PublicProject } from "@/types/public-portfolio";

/**
 * Manually reviewed copy for public display. Do not import private Workspace,
 * shared-memory cases, logs, account data, or database-derived snapshots here.
 */
export const publicPortfolio = {
  name: "Caider / CDC666",
  githubUrl: "https://github.com/CDC666-666",
  updatedAt: "2026-10-12",
  launchedAt: null as string | null,
  introduction: "电气工程学习者，关注嵌入式、电机控制与机器人实践。通过项目把控制链路、软件实现和调试过程逐步连接起来。",
} as const;

export const publicProjects: readonly PublicProject[] = [
  {
    slug: "robomaster-infantry",
    number: "01",
    title: "RoboMaster 全向轮步兵电控",
    direction: "机器人",
    status: "持续调试",
    summary: "围绕全向轮步兵的底盘、云台与视觉接口，梳理控制链路并持续做联调。",
    role: "参与电控与视觉联调；整理上下位机接口和云台问题的排查记录。",
    sourceDate: "2026-10-07",
    technologies: ["STM32", "CAN", "电机控制", "Ubuntu 视觉"],
    goal: "让底盘、云台与视觉模块在明确的模式和版本边界下协同工作。",
    approach: [
      "下位机负责底盘与云台执行，上位机完成视觉处理与目标规划。",
      "调试时先对齐控制模式、参考值、反馈值及固件与程序版本。",
    ],
    challenge: "切入时云台的动作不能仅凭画面识别结果判断来源，需要先区分初始化与视觉接管，再对照现场数据。",
    outcome: "已形成可检索的控制链路与历史问题整理；当前车上的固件和 Ubuntu 运行版本仍需现场核实。",
    next: "采集同一时间轴的模式、参考值和反馈值，核对实车运行版本。",
    visual: "robot",
  },
  {
    slug: "three-axis-arm",
    number: "02",
    title: "三轴机械臂与达妙电机控制",
    direction: "嵌入式与控制",
    status: "资料待补",
    summary: "三轴机械臂与达妙电机控制方向的实践项目。详细方案和结果尚待整理。",
    role: "具体职责及个人实现范围待补充。",
    technologies: ["三轴机械臂", "达妙电机"],
    goal: "围绕三轴机械臂和电机控制建立可复现的项目记录。",
    approach: ["控制结构、驱动接口与软件版本待核对后补充。"],
    challenge: "暂无可公开核对的代表性调试问题与处理过程。",
    outcome: "目前仅确认项目名称与技术方向；尚无可公开核对的性能或实验结果。",
    next: "补充硬件配置、本人职责、方案、测试记录和可公开的图像资料。",
    visual: "arm",
  },
  {
    slug: "personal-workspace",
    number: "03",
    title: "个人工作台",
    direction: "软件工程",
    status: "持续迭代",
    summary: "为学习、项目与工程经验建立统一的私人工作区，并逐步迁移到服务器数据源。",
    role: "提出功能需求，核对工程经验的数据与访问边界，并参与页面和部署验收；具体编码分工待补充。",
    sourceDate: "2026-10-11",
    technologies: ["Next.js", "TypeScript", "PostgreSQL", "Prisma"],
    goal: "将学习、项目和工程记录放入可持续维护的私人工作区。",
    approach: [
      "使用 GitHub 登录与服务器数据库保存私人业务数据。",
      "工程经验复用知识实体，区分审核状态与证据状态。",
    ],
    challenge: "迁移和部署时需要保持记录归属、版本及内容一致，并避免把私人数据带入公开页面。",
    outcome: "服务器版已通过 SSH 隧道完成登录、私人接口与工程经验页面验收；正式公网站点尚未启用。",
    next: "继续完善备份、内容发布边界与后续上线条件。",
    repositoryUrl: "https://github.com/CDC666-666/CDC_WORk",
    visual: "workspace",
  },
];
export const publicCapabilities: readonly PublicCapability[] = [
  {
    title: "嵌入式",
    level: "已用于项目",
    description: "在 RoboMaster 下位机控制链路中接触 STM32、CAN 与执行机构接口。",
    projectSlugs: ["robomaster-infantry"],
  },
  {
    title: "控制",
    level: "正在学习",
    description: "关注电机控制、模式切换与参考值和反馈值的对应关系。",
    projectSlugs: ["robomaster-infantry", "three-axis-arm"],
  },
  {
    title: "机器人",
    level: "已用于项目",
    description: "通过全向轮步兵实践整理底盘、云台和视觉之间的接口。",
    projectSlugs: ["robomaster-infantry"],
  },
];
