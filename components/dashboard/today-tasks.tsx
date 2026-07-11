import {
  CheckCircle2,
  Circle,
  CircleDotDashed,
  Clock3,
  ListChecks,
  OctagonAlert,
  type LucideIcon,
} from "lucide-react";

import { PanelHeader } from "@/components/dashboard/panel-header";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getModule, tasks } from "@/data/mock-data";
import type { Priority, TaskStatus } from "@/types";

const statusIcons: Record<TaskStatus, LucideIcon> = {
  待开始: Circle,
  进行中: CircleDotDashed,
  已完成: CheckCircle2,
  受阻: OctagonAlert,
};

const statusIconClasses: Record<TaskStatus, string> = {
  待开始: "text-muted-foreground",
  进行中: "text-cyan-300",
  已完成: "text-emerald-300",
  受阻: "text-rose-300",
};

const priorityVariants: Record<Priority, BadgeProps["variant"]> = {
  高: "warning",
  中: "outline",
  低: "secondary",
};

export function TodayTasks() {
  const completedTasks = tasks.filter((task) => task.status === "已完成").length;
  const completion = Math.round((completedTasks / tasks.length) * 100);

  return (
    <Card
      className="panel-topline h-full animate-panel-enter overflow-hidden motion-reduce:animate-none"
      style={{ animationDelay: "120ms" }}
    >
      <PanelHeader
        index="03 / TODAY"
        title="今日任务"
        icon={ListChecks}
        trailing={<Badge variant="outline">{tasks.length} 项</Badge>}
      />
      <CardContent className="p-0">
        <div className="border-b border-border px-5 py-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">今日完成度</span>
            <span className="font-mono text-foreground">
              {completedTasks} / {tasks.length}
            </span>
          </div>
          <Progress
            value={completion}
            indicatorClassName="bg-emerald-400"
            aria-label="今日任务完成度"
          />
        </div>

        <div className="divide-y divide-border">
          {tasks.map((task) => {
            const StatusIcon = statusIcons[task.status];
            const projectModule = getModule(task.moduleId);

            return (
              <div
                key={task.id}
                className="group flex gap-3 px-5 py-4 transition-colors hover:bg-secondary/35"
              >
                <StatusIcon
                  className={`mt-0.5 h-4 w-4 shrink-0 ${statusIconClasses[task.status]}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium leading-5 ${task.status === "已完成" ? "text-muted-foreground line-through" : "text-foreground"}`}
                      >
                        {task.title}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span className="font-mono text-cyan-300/80">
                          {projectModule?.shortName ?? "GENERAL"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock3 className="h-3 w-3" />
                          {task.dueAt}
                        </span>
                        <span>{task.estimateHours}h</span>
                      </div>
                    </div>
                    <Badge
                      variant={priorityVariants[task.priority]}
                      className="w-fit shrink-0"
                    >
                      {task.priority}优先级
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
