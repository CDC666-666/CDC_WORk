export type NavigationIconKey =
  | "home"
  | "sparkles"
  | "checkSquare"
  | "graduationCap"
  | "bookOpen"
  | "playSquare"
  | "library"
  | "chartNoAxesColumnIncreasing"
  | "folderKanban"
  | "bot"
  | "notebookPen"
  | "flaskConical"
  | "calendarDays"
  | "fileChartColumn"
  | "briefcaseBusiness"
  | "walletCards"
  | "workflow"
  | "settings";

export interface NavigationItem {
  label: string;
  href: string;
  icon: NavigationIconKey;
  description: string;
}

export interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

export const navigationGroups: NavigationGroup[] = [
  {
    label: "总览",
    items: [
      { label: "工作台", href: "/", icon: "home", description: "今日总览与重点事项" },
      {
        label: "AI 助手",
        href: "/assistant",
        icon: "sparkles",
        description: "统一 AI 输入入口",
      },
      {
        label: "今日任务",
        href: "/today",
        icon: "checkSquare",
        description: "今日执行清单",
      },
    ],
  },
  {
    label: "学习成长",
    items: [
      {
        label: "学习中心",
        href: "/learning",
        icon: "graduationCap",
        description: "课程与学习目标",
      },
      {
        label: "阅读计划",
        href: "/reading",
        icon: "bookOpen",
        description: "书目与阅读进度",
      },
      {
        label: "视频与技术内容",
        href: "/content",
        icon: "playSquare",
        description: "技术内容发现与整理",
      },
      {
        label: "知识库",
        href: "/knowledge",
        icon: "library",
        description: "沉淀可复用知识",
      },
      {
        label: "技能树",
        href: "/skills",
        icon: "chartNoAxesColumnIncreasing",
        description: "技能进度与下一目标",
      },
    ],
  },
  {
    label: "项目研发",
    items: [
      {
        label: "我的项目",
        href: "/projects",
        icon: "folderKanban",
        description: "个人项目组合",
      },
      {
        label: "RoboMaster",
        href: "/robomaster",
        icon: "bot",
        description: "机器人研发模块",
      },
      {
        label: "工程日志",
        href: "/logs",
        icon: "notebookPen",
        description: "开发与调试记录",
      },
      {
        label: "测试与复盘",
        href: "/reviews",
        icon: "flaskConical",
        description: "测试数据与问题闭环",
      },
    ],
  },
  {
    label: "个人管理",
    items: [
      {
        label: "日历计划",
        href: "/calendar",
        icon: "calendarDays",
        description: "日程与长期计划",
      },
      {
        label: "报告中心",
        href: "/reports",
        icon: "fileChartColumn",
        description: "日报、周报和项目报告",
      },
      {
        label: "简历素材",
        href: "/resume",
        icon: "briefcaseBusiness",
        description: "项目成果与经历素材",
      },
      {
        label: "理财记录",
        href: "/finance",
        icon: "walletCards",
        description: "简单个人收支记录",
      },
    ],
  },
  {
    label: "系统",
    items: [
      {
        label: "自动化",
        href: "/automation",
        icon: "workflow",
        description: "后续工作流入口",
      },
      {
        label: "设置",
        href: "/settings",
        icon: "settings",
        description: "工作台偏好设置",
      },
    ],
  },
];

export const navigationItems = navigationGroups.flatMap((group) => group.items);

export const placeholderSections = navigationItems
  .filter((item) => item.href !== "/" && item.href !== "/content")
  .map((item) => item.href.slice(1));

export function getNavigationItemBySection(section: string) {
  return navigationItems.find((item) => item.href === `/${section}`);
}
