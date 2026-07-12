import Link from "next/link";
import { BookOpen, CalendarClock, GraduationCap } from "lucide-react";

import { SectionHeader } from "@/components/shared/section-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useWorkspaceData } from "@/hooks/use-workspace-data";
import { formatChineseDate } from "@/lib/date";

export function StudyOverview() {
  const { data } = useWorkspaceData();
  const plans = data.studyPlans.filter((plan) => plan.status === "进行中").slice(0, 3);
  const readingItems = data.readingItems;
  const currentBook = readingItems.find((item) => item.status === "阅读中") ?? readingItems[0];
  const readingProgress = currentBook
    ? Math.round((currentBook.currentPage / currentBook.totalPages) * 100)
    : 0;

  return (
    <Card className="h-full rounded-lg bg-white shadow-sm">
      <CardHeader className="border-b border-border p-5">
        <SectionHeader
          title="学习计划"
          description="课程、阅读和阶段目标"
          action={<Link href="/learning" className="text-[11px] font-medium text-blue-600">管理计划</Link>}
        />
      </CardHeader>
      <CardContent className="p-5">
        <div className="space-y-4">
          {plans.map((plan) => (
            <div key={plan.id}>
              <div className="flex items-start gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-blue-50 text-blue-600">
                  {plan.category === "课程" ? (
                    <GraduationCap className="h-4 w-4" />
                  ) : plan.category === "技术" ? (
                    <BookOpen className="h-4 w-4" />
                  ) : (
                    <CalendarClock className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium text-slate-800">{plan.title}</p>
                    <span className="text-[10px] text-slate-400">{formatChineseDate(plan.deadline)}</span>
                  </div>
                  <p className="mt-1 truncate text-[11px] text-slate-500">{plan.nextAction}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <Progress value={plan.progress} className="h-1 flex-1 bg-slate-100" />
                    <span className="w-8 text-right text-[10px] font-medium text-slate-500">
                      {plan.progress}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {currentBook && (
          <div className="mt-5 border-t border-border pt-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-violet-600">正在阅读</p>
                <p className="mt-1 truncate text-sm font-medium text-slate-800">{currentBook.title}</p>
              </div>
              <span className="shrink-0 text-xs text-slate-500">
                {currentBook.currentPage}/{currentBook.totalPages} 页
              </span>
            </div>
            <Progress value={readingProgress} className="mt-3 h-1.5 bg-slate-100" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
