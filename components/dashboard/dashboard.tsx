"use client";

import { useMemo } from "react";

import { AiCommand } from "@/components/dashboard/ai-command";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ProjectOverview } from "@/components/dashboard/project-overview";
import { RecentContent } from "@/components/dashboard/recent-content";
import { SkillGrowth } from "@/components/dashboard/skill-growth";
import { StudyOverview } from "@/components/dashboard/study-overview";
import { TodayTasks } from "@/components/dashboard/today-tasks";
import { WeeklyMetrics } from "@/components/dashboard/weekly-metrics";
import { useWorkspaceData } from "@/hooks/use-workspace-data";
import { buildDashboardMetrics } from "@/services/dashboard-service";
import type { DashboardData } from "@/types/dashboard";

interface DashboardProps {
  data: DashboardData;
}

export function Dashboard({ data }: DashboardProps) {
  const { data: workspace } = useWorkspaceData();
  const metrics = useMemo(
    () => buildDashboardMetrics(data.metrics, workspace),
    [data.metrics, workspace],
  );

  return (
    <div className="space-y-5 lg:space-y-6">
      <DashboardHeader user={data.user} tasks={workspace.tasks} />
      <WeeklyMetrics metrics={metrics} />

      <div className="grid grid-cols-12 gap-4 lg:gap-5">
        <section className="col-span-12 xl:col-span-7">
          <TodayTasks />
        </section>
        <section className="col-span-12 xl:col-span-5">
          <StudyOverview />
        </section>
        <section className="col-span-12 xl:col-span-7">
          <ProjectOverview projects={data.projects} />
        </section>
        <section className="col-span-12 xl:col-span-5">
          <RecentContent items={data.recentContent} />
        </section>
        <section className="col-span-12 xl:col-span-7">
          <SkillGrowth skills={data.skills} />
        </section>
        <section className="col-span-12 xl:col-span-5">
          <AiCommand />
        </section>
      </div>
    </div>
  );
}
