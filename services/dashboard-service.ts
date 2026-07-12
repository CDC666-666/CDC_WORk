import { mockDashboardData } from "@/data/mock-dashboard";
import type { DashboardData } from "@/types/dashboard";

export async function getDashboardData(): Promise<DashboardData> {
  return {
    ...mockDashboardData,
    metrics: mockDashboardData.metrics.map((metric) => ({ ...metric })),
    tasks: mockDashboardData.tasks.map((task) => ({ ...task, tags: [...task.tags] })),
    studyPlans: mockDashboardData.studyPlans.map((plan) => ({ ...plan })),
    readingItems: mockDashboardData.readingItems.map((item) => ({ ...item })),
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
