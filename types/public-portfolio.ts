export type ProjectDirection = "机器人" | "嵌入式与控制" | "软件工程";
export type ProjectStatus = "持续调试" | "资料待补" | "持续迭代";

/** Explicitly curated public fields. This model never accepts Workspace entities. */
export interface PublicProject {
  slug: string;
  title: string;
  number: string;
  direction: ProjectDirection;
  status: ProjectStatus;
  summary: string;
  role: string;
  /** Verified project dates only. Never infer these from documentation dates. */
  startDate?: string;
  endDate?: string;
  sourceDate?: string;
  technologies: readonly string[];
  goal: string;
  approach: readonly string[];
  challenge: string;
  outcome: string;
  next: string;
  repositoryUrl?: string;
  visual: "robot" | "arm" | "workspace";
}

export interface PublicCapability {
  title: string;
  level: "正在学习" | "已用于项目" | "有成果验证" | "资料待补";
  description: string;
  projectSlugs: readonly string[];
}
