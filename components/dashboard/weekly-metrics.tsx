import {
  BookOpen,
  CheckSquare2,
  Clock3,
  FolderKanban,
  PlaySquare,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import type { DashboardMetric } from "@/types/dashboard";

interface WeeklyMetricsProps {
  metrics: DashboardMetric[];
}

const metricIcons: Record<string, LucideIcon> = {
  "today-tasks": CheckSquare2,
  "study-hours": Clock3,
  reading: BookOpen,
  content: PlaySquare,
  projects: FolderKanban,
  finance: WalletCards,
};

const toneClasses: Record<DashboardMetric["tone"], string> = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  neutral: "bg-slate-100 text-slate-600",
};

export function WeeklyMetrics({ metrics }: WeeklyMetricsProps) {
  return (
    <section aria-label="今日概览" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
      {metrics.map((metric) => {
        const Icon = metricIcons[metric.id] ?? CheckSquare2;
        return (
          <article key={metric.id} className="rounded-lg border border-border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className={`grid h-9 w-9 place-items-center rounded-md ${toneClasses[metric.tone]}`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-[10px] text-slate-400">TODAY</span>
            </div>
            <p className="mt-4 text-xs text-slate-500">{metric.label}</p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-semibold text-slate-950">{metric.value}</span>
              {metric.unit && <span className="text-[11px] text-slate-500">{metric.unit}</span>}
            </div>
            <p className="mt-2 truncate text-[10px] text-slate-400">{metric.helper}</p>
          </article>
        );
      })}
    </section>
  );
}
