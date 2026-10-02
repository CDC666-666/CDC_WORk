import {
  BatteryCharging,
  ClipboardCheck,
  Crosshair,
  Focus,
  GaugeCircle,
  Move3d,
  type LucideIcon,
} from "lucide-react";

import { PanelHeader } from "@/components/dashboard/panel-header";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getDemoFocusModules } from "@/services/dashboard-service";
import type { ModuleStatus } from "@/types";

const moduleIcons: Record<string, LucideIcon> = {
  motor: GaugeCircle,
  supercap: BatteryCharging,
  "force-chassis": Move3d,
  "auto-aim": Crosshair,
  "test-review": ClipboardCheck,
};

const statusVariants: Record<ModuleStatus, BadgeProps["variant"]> = {
  开发中: "default",
  验证中: "warning",
  待规划: "outline",
  稳定: "success",
};

export function FocusModules() {
  return (
    <Card
      className="panel-topline h-full animate-panel-enter overflow-hidden motion-reduce:animate-none"
      style={{ animationDelay: "180ms" }}
    >
      <PanelHeader
        index="04 / MODULES"
        title="当前重点模块"
        icon={Focus}
        trailing={<span className="font-mono text-[10px] text-muted-foreground">5 / 5</span>}
      />
      <CardContent className="divide-y divide-border p-0">
        {getDemoFocusModules().map((module) => {
          const Icon = moduleIcons[module.id] ?? Focus;

          return (
            <div
              key={module.id}
              className="flex gap-3 px-5 py-3.5 transition-colors hover:bg-secondary/35"
            >
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-sm border border-border bg-secondary/70">
                <Icon className="h-4 w-4 text-cyan-300" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {module.name}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {module.currentTarget}
                    </p>
                  </div>
                  <Badge
                    variant={statusVariants[module.status]}
                    className="shrink-0"
                  >
                    {module.status}
                  </Badge>
                </div>
                <div className="mt-2.5 flex items-center gap-3">
                  <Progress value={module.progress} className="h-1 flex-1" />
                  <span className="w-8 text-right font-mono text-[10px] text-muted-foreground">
                    {module.progress}%
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
