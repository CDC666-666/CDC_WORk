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
  technologies: readonly string[];
  goal: string;
  approach: readonly string[];
  challenge: string;
  outcome: string;
  next: string;
  repositoryUrl?: string;
  visual: "robot" | "arm" | "workspace";
}

export interface PublicMilestone {
  date: string;
  title: string;
  summary: string;
  tags: readonly string[];
  direction: ProjectDirection;
  projectSlug: string;
}

export interface PublicCapability {
  title: string;
  level: "正在学习" | "已用于项目" | "有成果验证" | "资料待补";
  description: string;
  projectSlugs: readonly string[];
}
