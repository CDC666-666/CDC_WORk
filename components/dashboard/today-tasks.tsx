"use client";

import { CheckCircle2, Circle, Clock3, ListChecks } from "lucide-react";

import { SectionHeader } from "@/components/shared/section-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useWorkspaceData } from "@/hooks/use-workspace-data";
import { formatChineseDateTime, toLocalDateKey } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { Priority } from "@/types/dashboard";

const priorityClasses: Record<Priority, string> = {
  高: "border-rose-200 bg-rose-50 text-rose-700",
  中: "border-amber-200 bg-amber-50 text-amber-700",
  低: "border-slate-200 bg-slate-50 text-slate-600",
};

const domainClasses: Record<string, string> = {
  学校学习: "text-blue-700",
  阅读成长: "text-violet-700",
  项目研发: "text-emerald-700",
  内容学习: "text-amber-700",
  个人管理: "text-slate-700",
};

export function TodayTasks() {
  const { data, toggleTaskCompleted } = useWorkspaceData();
  const tasks = data.tasks.filter((task) => task.scheduledDate === toLocalDateKey());
  const completedCount = tasks.filter((task) => task.status === "已完成").length;
  const completion = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <Card className="h-full rounded-lg bg-white shadow-sm">
      <CardHeader className="border-b border-border p-5">
        <SectionHeader
          title="今日任务"
          description="课程、阅读、项目和内容学习统一执行"
          action={
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <ListChecks className="h-4 w-4 text-blue-600" />
              {completedCount}/{tasks.length}
            </span>
          }
        />
        <Progress value={completion} className="mt-4 h-1.5 bg-slate-100" />
      </CardHeader>
      <CardContent className="divide-y divide-border p-0">
        {tasks.map((task) => {
          const isCompleted = task.status === "已完成";
          return (
            <div key={task.id} className="flex gap-3 px-5 py-4 hover:bg-slate-50/80">
              <button
                type="button"
                className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                aria-label={isCompleted ? `将${task.title}标记为未完成` : `完成${task.title}`}
                aria-pressed={isCompleted}
                onClick={() => toggleTaskCompleted(task.id)}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-[18px] w-[18px] text-emerald-600" />
                ) : (
                  <Circle className="h-[18px] w-[18px]" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium leading-5",
                        isCompleted ? "text-slate-400 line-through" : "text-slate-800",
                      )}
                    >
                      {task.title}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                      <span className={cn("font-medium", domainClasses[task.domain ?? "个人管理"])}>
                        {task.domain}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock3 className="h-3 w-3" />
                        {formatChineseDateTime(task.dueAt)}
                      </span>
                      <span>{task.estimateHours}h</span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "w-fit shrink-0 rounded border px-2 py-0.5 text-[10px] font-medium",
                      priorityClasses[task.priority],
                    )}
                  >
                    {task.priority}优先级
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
