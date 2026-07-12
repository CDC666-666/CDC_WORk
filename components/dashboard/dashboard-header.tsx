"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CalendarCheck2, CircleDot } from "lucide-react";

import type { Task, UserProfile } from "@/types/dashboard";

interface DashboardHeaderProps {
  user: UserProfile;
  tasks: Task[];
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "早上好";
  if (hour < 14) return "中午好";
  if (hour < 18) return "下午好";
  return "晚上好";
}

export function DashboardHeader({ user, tasks }: DashboardHeaderProps) {
  const [greeting, setGreeting] = useState("你好");

  useEffect(() => setGreeting(getGreeting()), []);

  const importantTasks = tasks
    .filter((task) => task.status !== "已完成")
    .sort((left, right) => {
      const rank = { 高: 0, 中: 1, 低: 2 };
      return rank[left.priority] - rank[right.priority];
    })
    .slice(0, 3);

  return (
    <section className="border-b border-border bg-white px-5 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">
              SPRINT 1
            </span>
            <span className="text-xs text-slate-500">{user.studentStatus ?? user.grade}</span>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-500">{user.role}</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
            {greeting}，{user.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {user.headline ?? "今天继续推进学习和工程项目。"}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {user.focusAreas.map((area) => (
              <span
                key={area}
                className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600"
              >
                {area}
              </span>
            ))}
          </div>
        </div>

        <div className="w-full max-w-xl border-l-2 border-blue-500 pl-4 lg:pl-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <CalendarCheck2 className="h-4 w-4 text-blue-600" />
              今天最重要的三件事
            </p>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </div>
          <ol className="space-y-2.5">
            {importantTasks.map((task, index) => (
              <li key={task.id} className="flex items-start gap-3 text-sm">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded bg-slate-100 text-[10px] font-semibold text-slate-600">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 text-slate-700">{task.title}</span>
                <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
