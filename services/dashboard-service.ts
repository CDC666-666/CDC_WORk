import { mockDashboardData } from "@/data/mock-dashboard";
import { isDateInCurrentWeek, toLocalDateKey } from "@/lib/date";
import type { DashboardData } from "@/types/dashboard";
import type { WorkspaceData } from "@/types/workspace";

export async function getDashboardData(): Promise<DashboardData> {
  return {
    ...mockDashboardData,
    metrics: mockDashboardData.metrics.map((metric) => ({ ...metric })),
    tasks: mockDashboardData.tasks.map((task) => ({ ...task, tags: [...task.tags] })),
    studyPlans: mockDashboardData.studyPlans.map((plan) => ({ ...plan, tags: [...plan.tags] })),
    readingItems: mockDashboardData.readingItems.map((item) => ({ ...item, tags: [...item.tags] })),
    projects: mockDashboardData.projects.map((project) => ({
      ...project,
      moduleIds: [...project.moduleIds],
    })),
    skills: mockDashboardData.skills.map((skill) => ({ ...skill })),
    recentContent: mockDashboardData.recentContent.map((item) => ({
      ...item,
      tags: [...item.tags],
    })),
    finance: { ...mockDashboardData.finance },
    user: {
      ...mockDashboardData.user,
      techStack: [...mockDashboardData.user.techStack],
      focusAreas: [...mockDashboardData.user.focusAreas],
      goals: [...(mockDashboardData.user.goals ?? [])],
    },
  };
}

export function buildDashboardMetrics(
  baseMetrics: DashboardData["metrics"],
  workspace: WorkspaceData,
): DashboardData["metrics"] {
  const today = toLocalDateKey();
  const todayTasks = workspace.tasks.filter((task) => task.scheduledDate === today);
  const completedToday = todayTasks.filter((task) => task.status === "已完成").length;
  const highPriority = todayTasks.filter((task) => task.priority === "高" && task.status !== "已完成").length;
  const weeklyMinutes = workspace.studySessions
    .filter((session) => isDateInCurrentWeek(session.date))
    .reduce((total, session) => total + session.durationMinutes, 0);
  const unread = workspace.readingItems.filter((item) => item.status !== "已完成").length;
  const readingNow = workspace.readingItems.filter((item) => item.status === "阅读中").length;
  const month = today.slice(0, 7);
  const monthlyFinance = workspace.financeTransactions.filter((item) => item.date.startsWith(month));
  const income = monthlyFinance.filter((item) => item.type === "收入").reduce((sum, item) => sum + item.amount, 0);
  const expense = monthlyFinance.filter((item) => item.type === "支出").reduce((sum, item) => sum + item.amount, 0);

  return baseMetrics.map((metric) => {
    if (metric.id === "today-tasks") {
      return {
        ...metric,
        value: String(todayTasks.length - completedToday),
        helper: `${completedToday} 项已完成 · ${highPriority} 项高优先级`,
      };
    }
    if (metric.id === "study-hours") {
      return {
        ...metric,
        value: (weeklyMinutes / 60).toFixed(1),
        helper: `${workspace.studySessions.filter((session) => isDateInCurrentWeek(session.date)).length} 次学习记录`,
      };
    }
    if (metric.id === "reading") {
      return { ...metric, value: String(unread), helper: `${readingNow} 本正在阅读` };
    }
    if (metric.id === "finance") {
      return { ...metric, value: (income - expense).toFixed(0), helper: `收入 ¥${income.toFixed(0)} · 支出 ¥${expense.toFixed(0)}` };
    }
    return metric;
  });
}
