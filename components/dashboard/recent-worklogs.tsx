import { BookOpenCheck, Clock3 } from "lucide-react";

import { PanelHeader } from "@/components/dashboard/panel-header";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getModule, workLogs } from "@/data/mock-data";
import type { WorkLogResult } from "@/types";

const resultVariants: Record<WorkLogResult, BadgeProps["variant"]> = {
  完成: "success",
  部分完成: "warning",
  受阻: "danger",
};

function formatLogDate(date: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Shanghai",
  }).format(new Date(date));
}

export function RecentWorklogs() {
  return (
    <Card
      className="panel-topline h-full animate-panel-enter overflow-hidden motion-reduce:animate-none"
      style={{ animationDelay: "240ms" }}
    >
      <PanelHeader
        index="05 / LOGS"
        title="最近工作日志"
        icon={BookOpenCheck}
        trailing={<Badge variant="outline">最近 3 条</Badge>}
      />
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {workLogs.map((log) => {
            const projectModule = getModule(log.moduleId);

            return (
              <article
                key={log.id}
                className="relative px-5 py-4 pl-10 transition-colors hover:bg-secondary/35"
              >
                <span className="absolute left-5 top-5 h-2 w-2 rounded-full border-2 border-cyan-300 bg-card" />
                <span className="absolute bottom-0 left-[23px] top-7 w-px bg-border last:hidden" />
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-medium text-foreground">{log.title}</h3>
                      <span className="font-mono text-[10px] text-cyan-300/80">
                        {projectModule?.shortName ?? "GENERAL"}
                      </span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {log.summary}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
                      <span>{formatLogDate(log.date)}</span>
                      <span className="flex items-center gap-1">
                        <Clock3 className="h-3 w-3" />
                        {log.durationMinutes} 分钟
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={resultVariants[log.result]}
                    className="w-fit shrink-0"
                  >
                    {log.result}
                  </Badge>
                </div>
              </article>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
