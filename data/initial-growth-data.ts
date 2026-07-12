import { localDateKeyWithOffset, localDateTimeWithOffset } from "@/lib/date";
import { ROBOMASTER_PROJECT_ID, WORKSPACE_PROJECT_ID } from "@/data/initial-engineering-data";
import type { KnowledgeItem } from "@/types/knowledge";
import type { ReportRecord } from "@/types/report";
import type { ResumeMaterial } from "@/types/resume";
import type { Skill, SkillEvidence } from "@/types/skill";

export interface InitialGrowthData {
  knowledgeItems: KnowledgeItem[];
  skills: Skill[];
  skillEvidence: SkillEvidence[];
  reports: ReportRecord[];
  resumeMaterials: ResumeMaterial[];
}

export function createInitialGrowthData(now = new Date()): InitialGrowthData {
  const timestamp = now.toISOString();
  const knowledgeItems: KnowledgeItem[] = [
    { id: "knowledge-can-filter", title: "CAN 扩展帧过滤器排查方法", content: "演示知识：从帧类型、ID 位宽、掩码和回调路径依次检查。", summary: "按物理层到过滤器配置的顺序定位 CAN 接收问题。", itemType: "故障方案", category: "嵌入式", sourceType: "issue", sourceId: "issue-can-filter", projectId: ROBOMASTER_PROJECT_ID, moduleId: "module-can", sourceUrl: "", tags: ["CAN", "STM32"], status: "已整理", importance: 5, createdAt: localDateTimeWithOffset(now, -6, "21:00"), updatedAt: timestamp },
    { id: "knowledge-motor-test", title: "M3508 带载速度环测试清单", content: "演示知识：记录目标转速、负载、超调、稳定时间和换向响应。", summary: "把速度环调参转换为可复现的测试流程。", itemType: "测试结论", category: "控制", sourceType: "test", sourceId: "test-motor-step", projectId: ROBOMASTER_PROJECT_ID, moduleId: "module-motor", sourceUrl: "", tags: ["M3508", "PID", "测试"], status: "已整理", importance: 5, createdAt: localDateTimeWithOffset(now, 0, "12:00"), updatedAt: timestamp },
    { id: "knowledge-coordinate", title: "自瞄坐标链路接口草案", content: "演示知识：相机坐标、云台姿态、世界坐标和时间戳必须明确归属。", summary: "电控与视觉联调前先统一坐标系和时间语义。", itemType: "项目经验", category: "算法", sourceType: "workLog", sourceId: "log-autoaim-coordinate", projectId: ROBOMASTER_PROJECT_ID, moduleId: "module-autoaim", sourceUrl: "", tags: ["自瞄", "坐标系"], status: "收件箱", importance: 4, createdAt: localDateTimeWithOffset(now, -3, "22:00"), updatedAt: timestamp },
    { id: "knowledge-workspace-schema", title: "个人工作台数据闭环设计", content: "演示知识：实体只保留一个真实数据源，页面通过 ID 关系形成不同视图。", summary: "统一 Workspace schema 和迁移边界。", itemType: "项目经验", category: "产品设计", sourceType: "project", sourceId: WORKSPACE_PROJECT_ID, projectId: WORKSPACE_PROJECT_ID, sourceUrl: "", tags: ["TypeScript", "数据模型"], status: "已整理", importance: 4, createdAt: localDateTimeWithOffset(now, -1, "17:00"), updatedAt: timestamp },
  ];

  const skillDefinitions: Array<[string, string, Skill["category"], number, number, Skill["status"], string?]> = [
    ["skill-stm32", "STM32", "嵌入式", 64, 80, "实践中"],
    ["skill-can", "CAN 通信", "嵌入式", 61, 82, "实践中", "skill-stm32"],
    ["skill-cpp", "C / C++", "软件", 58, 78, "学习中"],
    ["skill-python", "Python", "软件", 45, 70, "学习中"],
    ["skill-motor", "电机控制", "控制", 57, 82, "实践中"],
    ["skill-pid", "PID", "控制", 55, 80, "实践中", "skill-motor"],
    ["skill-supercap", "超级电容", "嵌入式", 38, 70, "学习中"],
    ["skill-linux", "Linux / Ubuntu", "工具链", 46, 72, "学习中"],
    ["skill-opencv", "OpenCV", "算法", 32, 68, "学习中"],
    ["skill-project", "项目管理", "项目管理", 43, 70, "实践中"],
    ["skill-product", "产品设计", "产品", 36, 68, "学习中"],
  ];
  const skills: Skill[] = skillDefinitions.map(([id, name, category, score, targetScore, status, parentId]) => ({
    id,
    parentId,
    name,
    category,
    description: `${name} 的演示成长路径，通过真实任务、日志和知识证据累计。`,
    level: Math.max(1, Math.ceil(score / 20)),
    score,
    targetScore,
    status,
    createdAt: localDateTimeWithOffset(now, -60, "09:00"),
    updatedAt: timestamp,
  }));
  const skillEvidence: SkillEvidence[] = [
    { id: "evidence-can-issue", skillId: "skill-can", evidenceType: "issue", sourceId: "issue-can-filter", projectId: ROBOMASTER_PROJECT_ID, description: "解决 CAN 扩展帧过滤器配置问题。", scoreChange: 6, occurredAt: localDateTimeWithOffset(now, -6, "20:00"), createdAt: localDateTimeWithOffset(now, -6, "20:00") },
    { id: "evidence-motor-log", skillId: "skill-motor", evidenceType: "workLog", sourceId: "log-motor-load", projectId: ROBOMASTER_PROJECT_ID, description: "完成 M3508 带载速度环演示测试。", scoreChange: 4, occurredAt: localDateTimeWithOffset(now, 0, "11:00"), createdAt: localDateTimeWithOffset(now, 0, "11:00") },
    { id: "evidence-pid-test", skillId: "skill-pid", evidenceType: "test", sourceId: "test-motor-step", projectId: ROBOMASTER_PROJECT_ID, description: "记录超调与稳定时间并形成复测结论。", scoreChange: 3, occurredAt: localDateTimeWithOffset(now, 0, "11:30"), createdAt: localDateTimeWithOffset(now, 0, "11:30") },
    { id: "evidence-product-schema", skillId: "skill-product", evidenceType: "knowledge", sourceId: "knowledge-workspace-schema", projectId: WORKSPACE_PROJECT_ID, description: "完成统一数据闭环设计。", scoreChange: 5, occurredAt: localDateTimeWithOffset(now, -1, "17:00"), createdAt: localDateTimeWithOffset(now, -1, "17:00") },
    { id: "evidence-project-sprint", skillId: "skill-project", evidenceType: "project", sourceId: WORKSPACE_PROJECT_ID, projectId: WORKSPACE_PROJECT_ID, description: "按 Phase 拆分 Sprint 并设置质量门。", scoreChange: 4, occurredAt: timestamp, createdAt: timestamp },
  ];

  const reports: ReportRecord[] = [
    { id: "report-demo-week", title: "工程与学习周报（演示草稿）", reportType: "周报", projectId: ROBOMASTER_PROJECT_ID, dateFrom: localDateKeyWithOffset(now, -6), dateTo: localDateKeyWithOffset(now, 0), content: "# 本周概览\n\n此报告由本地确定性模板生成，不是 AI 生成。", sourceRefs: ["log-motor-load", "test-motor-step"], status: "草稿", createdAt: timestamp, updatedAt: timestamp },
  ];

  const resumeMaterials: ResumeMaterial[] = [
    { id: "resume-demo-control", projectId: ROBOMASTER_PROJECT_ID, materialType: "技术挑战", title: "步兵底盘控制与测试闭环", originalContent: "负责演示项目中的底盘电机控制、CAN 通信与测试复盘。", polishedContentCn: "负责基于 STM32 与 CAN 的步兵底盘电控模块，建立电机闭环调试、测试记录和问题复盘流程。", polishedContentEn: "Owned the STM32 and CAN based chassis control workflow, including motor-loop tuning, test records, and issue reviews.", targetRole: "电控", metrics: {}, tags: ["STM32", "CAN", "电机控制"], status: "待整理", createdAt: timestamp, updatedAt: timestamp },
  ];

  return { knowledgeItems, skills, skillEvidence, reports, resumeMaterials };
}

