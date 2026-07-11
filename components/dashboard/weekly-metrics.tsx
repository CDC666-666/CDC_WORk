import {
  Bug,
  CheckCircle2,
  Clock3,
  FlaskConical,
  type LucideIcon,
} from "lucide-react";

import { PanelHeader } from "@/components/dashboard/panel-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { weeklyMetrics } from "@/data/mock-data";
import type { WeeklyMetric } from "@/types";

const metricIcons: Record<string, LucideIcon> = {
  "metric-hours": Clock3,
  "metric-tasks": CheckCircle2,
  "metric-tests": FlaskConical,
  "metric-issues": Bug,
};

const toneClasses: Record<WeeklyMetric["tone"], string> = {
  cyan: "text-cyan-300 bg-cyan-300",
  green: "text-emerald-300 bg-emerald-300",
  amber: "text-amber-300 bg-amber-300",
  neutral: "text-zinc-300 bg-zinc-300",
};

const metricSamples: Record<string, number[]> = {
  "metric-hours": [38, 55, 48, 72, 66, 86, 74],
  "metric-tasks": [22, 34, 34, 52, 62, 75, 75],
  "metric-tests": [18, 18, 42, 30, 58, 68, 82],
  "metric-issues": [78, 64, 64, 48, 38, 28, 20],
};

export function WeeklyMetrics() {
  return (
    <Card
      className="panel-topline h-full animate-panel-enter overflow-hidden motion-reduce:animate-none"
      style={{ animationDelay: "60ms" }}
    >
      <PanelHeader
        index="02 / WEEKLY"
        title="本周工程数据"
        icon={FlaskConical}
        trailing={<Badge variant="outline">第 28 周</Badge>}
      />
      <CardContent className="grid grid-cols-2 p-0">
        {weeklyMetrics.map((metric, index) => {
          const Icon = metricIcons[metric.id] ?? Clock3;
          const [textClass, barClass] = toneClasses[metric.tone].split(" ");
          const samples = metricSamples[metric.id] ?? [];

          return (
            <div
              key={metric.id}
              className={`min-w-0 p-4 ${index % 2 === 0 ? "border-r border-border" : ""} ${index < 2 ? "border-b border-border" : ""}`}
            >
              <div className="mb-4 flex items-center justify-between">
                <Icon className={`h-4 w-4 ${textClass}`} />
                <span className="truncate pl-2 text-[10px] text-muted-foreground">
                  {metric.change}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-semibold text-foreground">
                  {metric.value}
                </span>
                <span className="text-[10px] text-muted-foreground">{metric.unit}</span>
              </div>
              <div className="mt-4 flex h-5 items-end gap-1" aria-hidden="true">
                {samples.map((value, sampleIndex) => (
                  <span
                    key={`${metric.id}-${sampleIndex}`}
                    className={`min-w-0 flex-1 opacity-45 ${barClass}`}
                    style={{ height: `${value}%` }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
