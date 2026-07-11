import { AiCommand } from "@/components/dashboard/ai-command";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { FocusModules } from "@/components/dashboard/focus-modules";
import { ProjectOverview } from "@/components/dashboard/project-overview";
import { RecentWorklogs } from "@/components/dashboard/recent-worklogs";
import { SkillGrowth } from "@/components/dashboard/skill-growth";
import { TodayTasks } from "@/components/dashboard/today-tasks";
import { WeeklyMetrics } from "@/components/dashboard/weekly-metrics";

export function Dashboard() {
  return (
    <div>
      <DashboardHeader />
      <div className="grid grid-cols-12 gap-4 lg:gap-5">
        <section className="col-span-12 xl:col-span-8">
          <ProjectOverview />
        </section>
        <section className="col-span-12 xl:col-span-4">
          <WeeklyMetrics />
        </section>
        <section className="col-span-12 xl:col-span-7">
          <TodayTasks />
        </section>
        <section className="col-span-12 xl:col-span-5">
          <FocusModules />
        </section>
        <section className="col-span-12 xl:col-span-7">
          <RecentWorklogs />
        </section>
        <section className="col-span-12 xl:col-span-5">
          <SkillGrowth />
        </section>
        <section className="col-span-12">
          <AiCommand />
        </section>
      </div>
    </div>
  );
}
