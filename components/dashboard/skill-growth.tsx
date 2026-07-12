import { ArrowUpRight, ChartNoAxesColumnIncreasing } from "lucide-react";

import { SectionHeader } from "@/components/shared/section-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Skill } from "@/types/dashboard";

interface SkillGrowthProps {
  skills: Skill[];
}

export function SkillGrowth({ skills }: SkillGrowthProps) {
  return (
    <Card className="h-full rounded-lg bg-white shadow-sm">
      <CardHeader className="border-b border-border p-5">
        <SectionHeader
          title="技能成长"
          description="技术能力和项目方法同步积累"
          action={<ChartNoAxesColumnIncreasing className="h-4 w-4 text-blue-600" />}
        />
      </CardHeader>
      <CardContent className="grid gap-x-6 gap-y-5 p-5 sm:grid-cols-2">
        {skills.map((skill) => (
          <div key={skill.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-slate-800">{skill.name}</p>
                  <span className="text-[9px] text-slate-400">L{skill.level}</span>
                </div>
                <p className="mt-1 truncate text-[10px] text-slate-500">{skill.nextGoal}</p>
              </div>
              <span className="flex shrink-0 items-center gap-0.5 text-[10px] font-medium text-emerald-600">
                <ArrowUpRight className="h-3 w-3" />
                {skill.trend}%
              </span>
            </div>
            <Progress value={skill.progress} className="mt-3 h-1.5 bg-slate-100" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
