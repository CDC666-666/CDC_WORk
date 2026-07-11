import { ArrowUpRight, TrendingUp } from "lucide-react";

import { PanelHeader } from "@/components/dashboard/panel-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { skills } from "@/data/mock-data";
import { cn } from "@/lib/utils";

export function SkillGrowth() {
  return (
    <Card
      className="panel-topline h-full animate-panel-enter overflow-hidden motion-reduce:animate-none"
      style={{ animationDelay: "300ms" }}
    >
      <PanelHeader
        index="06 / SKILLS"
        title="技能成长"
        icon={TrendingUp}
        trailing={<Badge variant="success">本周 +7%</Badge>}
      />
      <CardContent className="divide-y divide-border p-0">
        {skills.map((skill) => (
          <div key={skill.id} className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{skill.name}</p>
                  <span className="text-[10px] text-muted-foreground">{skill.category}</span>
                </div>
                <p className="mt-1 truncate text-[11px] text-muted-foreground">
                  下一目标：{skill.nextGoal}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-0.5 font-mono text-[10px] text-emerald-300">
                <ArrowUpRight className="h-3 w-3" />
                {skill.trend}%
              </span>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className="flex shrink-0 gap-1" aria-label={`技能等级 ${skill.level}`}>
                {Array.from({ length: skill.maxLevel }, (_, index) => (
                  <span
                    key={`${skill.id}-level-${index}`}
                    className={cn(
                      "h-1.5 w-3 rounded-[1px]",
                      index < skill.level ? "bg-cyan-300" : "bg-secondary",
                    )}
                  />
                ))}
              </div>
              <Progress value={skill.progress} className="h-1 flex-1" />
              <span className="w-8 text-right font-mono text-[10px] text-muted-foreground">
                L{skill.level}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
