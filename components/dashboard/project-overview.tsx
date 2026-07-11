import { Boxes, CalendarDays, CircleGauge, ShieldAlert } from "lucide-react";

import { PanelHeader } from "@/components/dashboard/panel-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  activeProject,
  projectModules,
  technicalIssues,
  userProfile,
} from "@/data/mock-data";

export function ProjectOverview() {
  const openIssues = technicalIssues.filter((issue) => issue.status !== "已解决").length;

  return (
    <Card className="panel-topline h-full animate-panel-enter overflow-hidden motion-reduce:animate-none">
      <PanelHeader
        index="01 / PROJECT"
        title="当前 RoboMaster 项目"
        icon={Boxes}
        trailing={<Badge variant="success">{activeProject.status}</Badge>}
      />
      <CardContent className="p-5">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
          <div className="min-w-0 max-w-2xl">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold text-foreground">
                {activeProject.name}
              </h2>
              <span className="font-mono text-[10px] text-cyan-300">
                {activeProject.code}
              </span>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {activeProject.description}
            </p>
          </div>
          <div className="shrink-0 md:w-44">
            <div className="mb-2 flex items-end justify-between">
              <span className="text-xs text-muted-foreground">项目进度</span>
              <span className="font-mono text-2xl font-semibold text-cyan-200">
                {activeProject.progress}%
              </span>
            </div>
            <Progress value={activeProject.progress} />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 border-y border-border sm:grid-cols-4">
          <div className="border-b border-r border-border px-3 py-4 sm:border-b-0">
            <CalendarDays className="mb-2 h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">赛季</p>
            <p className="mt-1 text-sm font-medium text-foreground">{activeProject.season}</p>
          </div>
          <div className="border-b border-border px-3 py-4 sm:border-b-0 sm:border-r">
            <CircleGauge className="mb-2 h-4 w-4 text-cyan-300" />
            <p className="text-xs text-muted-foreground">工程模块</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {projectModules.length} 个模块
            </p>
          </div>
          <div className="border-r border-border px-3 py-4">
            <ShieldAlert className="mb-2 h-4 w-4 text-amber-300" />
            <p className="text-xs text-muted-foreground">遗留问题</p>
            <p className="mt-1 text-sm font-medium text-foreground">{openIssues} 个处理中</p>
          </div>
          <div className="px-3 py-4">
            <Boxes className="mb-2 h-4 w-4 text-emerald-300" />
            <p className="text-xs text-muted-foreground">负责人</p>
            <p className="mt-1 text-sm font-medium text-foreground">{userProfile.role}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {userProfile.techStack.map((technology) => (
            <Badge key={technology} variant="outline" className="font-mono">
              {technology}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
