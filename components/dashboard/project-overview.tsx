import { ArrowUpRight, FolderKanban, Target } from "lucide-react";

import { SectionHeader } from "@/components/shared/section-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Project } from "@/types/dashboard";

interface ProjectOverviewProps {
  projects: Project[];
}

const accentClasses = {
  blue: "bg-blue-600",
  green: "bg-emerald-600",
  amber: "bg-amber-500",
};

export function ProjectOverview({ projects }: ProjectOverviewProps) {
  return (
    <Card className="h-full rounded-lg bg-white shadow-sm">
      <CardHeader className="border-b border-border p-5">
        <SectionHeader
          title="项目进展"
          description="机器人研发与个人产品并行推进"
          action={<FolderKanban className="h-4 w-4 text-blue-600" />}
        />
      </CardHeader>
      <CardContent className="divide-y divide-border p-0">
        {projects.map((project) => (
          <article key={project.id} className="px-5 py-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${accentClasses[project.accent ?? "blue"]}`}
                  />
                  <h3 className="text-sm font-semibold text-slate-900">{project.name}</h3>
                  <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[9px] text-slate-500">
                    {project.code}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">{project.description}</p>
              </div>
              <div className="w-full shrink-0 sm:w-36">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">完成进度</span>
                  <span className="text-sm font-semibold text-slate-900">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-1.5 bg-slate-100" />
              </div>
            </div>
            <div className="mt-4 flex flex-col justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] sm:flex-row sm:items-center">
              <span className="flex min-w-0 items-center gap-1.5 text-slate-500">
                <Target className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span className="truncate">下一节点：{project.nextMilestone}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1 text-slate-500">
                {project.role}
                <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}
