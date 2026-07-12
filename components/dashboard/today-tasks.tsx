"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Clock3, ListChecks } from "lucide-react";

import { SectionHeader } from "@/components/shared/section-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Priority, Task } from "@/types/dashboard";

interface TodayTasksProps {
  tasks: Task[];
}

const taskStorageKey = "cdc-dashboard-task-state-v1";

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

export function TodayTasks({ tasks }: TodayTasksProps) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    () => new Set(tasks.filter((task) => task.status === "已完成").map((task) => task.id)),
  );
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(taskStorageKey);
    if (stored) {
      try {
        const ids = JSON.parse(stored) as string[];
        setCompletedIds(new Set(ids));
      } catch {
        window.localStorage.removeItem(taskStorageKey);
      }
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      window.localStorage.setItem(taskStorageKey, JSON.stringify([...completedIds]));
    }
  }, [completedIds, isHydrated]);

  const toggleTask = (taskId: string) => {
    setCompletedIds((current) => {
      const next = new Set(current);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const completion = Math.round((completedIds.size / tasks.length) * 100);

  return (
    <Card className="h-full rounded-lg bg-white shadow-sm">
      <CardHeader className="border-b border-border p-5">
        <SectionHeader
          title="今日任务"
          description="课程、阅读、项目和内容学习统一执行"
          action={
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <ListChecks className="h-4 w-4 text-blue-600" />
              {completedIds.size}/{tasks.length}
            </span>
          }
        />
        <Progress value={completion} className="mt-4 h-1.5 bg-slate-100" />
      </CardHeader>
      <CardContent className="divide-y divide-border p-0">
        {tasks.map((task) => {
          const isCompleted = completedIds.has(task.id);
          return (
            <div key={task.id} className="flex gap-3 px-5 py-4 hover:bg-slate-50/80">
              <button
                type="button"
                className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                aria-label={isCompleted ? `将${task.title}标记为未完成` : `完成${task.title}`}
                aria-pressed={isCompleted}
                onClick={() => toggleTask(task.id)}
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
                        {task.domain ?? "个人管理"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock3 className="h-3 w-3" />
                        {task.dueAt}
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
