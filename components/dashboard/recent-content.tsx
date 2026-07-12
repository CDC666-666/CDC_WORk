import Link from "next/link";
import { ArrowRight, Bookmark, FileText, PlaySquare } from "lucide-react";

import { SectionHeader } from "@/components/shared/section-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { RecentContentPreview } from "@/types/dashboard";

interface RecentContentProps {
  items: RecentContentPreview[];
}

export function RecentContent({ items }: RecentContentProps) {
  return (
    <Card className="h-full rounded-lg bg-white shadow-sm">
      <CardHeader className="border-b border-border p-5">
        <SectionHeader
          title="最近内容"
          description="最近收藏的视频、文章和项目"
          action={
            <Link href="/content" className="flex items-center gap-1 text-[11px] font-medium text-blue-600">
              查看全部
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
      </CardHeader>
      <CardContent className="divide-y divide-border p-0">
        {items.map((item) => (
          <Link key={item.id} href="/content" className="flex gap-3 px-5 py-4 hover:bg-slate-50">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-600">
              {item.contentType === "视频" ? (
                <PlaySquare className="h-4 w-4" />
              ) : item.contentType === "开源项目" ? (
                <Bookmark className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">{item.title}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                <span>{item.source}</span>
                <span>·</span>
                <span>{item.addedAt}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <span key={tag} className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] text-blue-700">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
