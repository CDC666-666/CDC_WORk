import Link from "next/link";
import { ChartNoAxesColumnIncreasing } from "lucide-react";

import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Skill, SkillEvidence } from "@/types/skill";

export function SkillGrowth({ skills, evidence }: { skills: Skill[]; evidence: SkillEvidence[] }) {
  return <Card className="h-full rounded-lg bg-white shadow-sm">
    <CardHeader className="border-b border-border p-5"><SectionHeader title="技能成长" description="由学习、工程记录和知识证据持续更新" action={<Button asChild size="sm" variant="ghost"><Link href="/skills"><ChartNoAxesColumnIncreasing />技能树</Link></Button>} /></CardHeader>
    <CardContent className="grid gap-x-6 gap-y-5 p-5 sm:grid-cols-2">
      {skills.slice(0, 6).map((skill) => {
        const count = evidence.filter((item) => item.skillId === skill.id).length;
        return <div key={skill.id}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><p className="truncate text-sm font-medium text-slate-800">{skill.name}</p><span className="text-[9px] text-slate-400">L{skill.level}</span></div><p className="mt-1 truncate text-[10px] text-slate-500">{skill.category} · {count} 条成长证据</p></div><span className="shrink-0 text-[10px] font-medium text-emerald-600">{skill.score}/{skill.targetScore}</span></div><Progress value={skill.targetScore ? skill.score / skill.targetScore * 100 : 0} className="mt-3 h-1.5 bg-slate-100" /></div>;
      })}
    </CardContent>
  </Card>;
}
