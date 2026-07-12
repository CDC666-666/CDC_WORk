import {
  BrainCircuit,
  BookPlus,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileCode2,
  Github,
  Music2,
  Play,
  Rss,
  Star,
  Tv2,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { contentTypeLabels, sourceLabels, statusLabels } from "@/lib/content";
import { cn } from "@/lib/utils";
import type { ContentItem, ContentSource, ContentViewMode } from "@/types/content";

interface ContentCardProps {
  item: ContentItem;
  viewMode: ContentViewMode;
  onAddToKnowledgeBase: (itemId: string) => void;
  onAddToStudyPlan: (itemId: string) => void;
  onOpenDemoLink: (item: ContentItem) => void;
  onShowSummary: (item: ContentItem) => void;
  onToggleCompleted: (itemId: string) => void;
  onToggleFavorite: (itemId: string) => void;
  onToggleWatchLater: (itemId: string) => void;
}

const sourceVisuals: Record<
  ContentSource,
  { className: string; icon: LucideIcon; shortLabel: string }
> = {
  bilibili: { className: "bg-sky-600", icon: Tv2, shortLabel: "BILI" },
  douyin: { className: "bg-slate-900", icon: Music2, shortLabel: "DOUYIN" },
  csdn: { className: "bg-rose-600", icon: FileCode2, shortLabel: "CSDN" },
  github: { className: "bg-slate-800", icon: Github, shortLabel: "GITHUB" },
  blog: { className: "bg-emerald-700", icon: Rss, shortLabel: "BLOG" },
};

const statusClasses: Record<ContentItem["status"], string> = {
  unprocessed: "border-slate-200 bg-slate-50 text-slate-600",
  watchLater: "border-amber-200 bg-amber-50 text-amber-700",
  summarized: "border-blue-200 bg-blue-50 text-blue-700",
  favorite: "border-violet-200 bg-violet-50 text-violet-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

function formatPublishedAt(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export function ContentCard({
  item,
  viewMode,
  onAddToKnowledgeBase,
  onAddToStudyPlan,
  onOpenDemoLink,
  onShowSummary,
  onToggleCompleted,
  onToggleFavorite,
  onToggleWatchLater,
}: ContentCardProps) {
  const visual = sourceVisuals[item.source];
  const SourceIcon = visual.icon;
  const isCompleted = item.status === "completed";
  const isWatchLater = item.status === "watchLater";

  return (
    <article
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-white shadow-sm transition-shadow hover:shadow-md",
        viewMode === "list" && "lg:flex",
      )}
    >
      <div
        role="img"
        aria-label={`${item.title} 演示封面`}
        data-thumbnail={item.thumbnailUrl}
        className={cn(
          "content-cover-grid relative flex min-h-40 flex-col justify-between overflow-hidden p-4 text-white",
          visual.className,
          viewMode === "list" ? "lg:min-h-full lg:w-52 lg:shrink-0" : "sm:min-h-44",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-[10px] font-semibold">
            <SourceIcon className="h-4 w-4" />
            {visual.shortLabel}
          </span>
          <span className="rounded border border-white/30 bg-black/15 px-1.5 py-0.5 text-[9px]">
            DEMO
          </span>
        </div>
        <div>
          <div className="mb-3 grid h-10 w-10 place-items-center rounded-md border border-white/30 bg-white/15">
            {item.contentType === "video" ? (
              <Play className="h-5 w-5 fill-current" />
            ) : item.contentType === "repository" ? (
              <Github className="h-5 w-5" />
            ) : (
              <FileCode2 className="h-5 w-5" />
            )}
          </div>
          <p className="text-xs font-medium">{contentTypeLabels[item.contentType]}</p>
          <p className="mt-1 text-[10px] text-white/75">
            预计 {item.durationMinutes} 分钟
          </p>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
          <span>{sourceLabels[item.source]}</span>
          <span>·</span>
          <span>{item.author}</span>
          <span>·</span>
          <span>{formatPublishedAt(item.publishedAt)}</span>
          <span
            className={cn(
              "ml-auto rounded border px-1.5 py-0.5 font-medium",
              statusClasses[item.status],
            )}
          >
            {statusLabels[item.status]}
          </span>
        </div>

        <h2 className="mt-3 text-base font-semibold leading-6 text-slate-950">{item.title}</h2>
        <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600">
          <span className="font-semibold text-blue-700">AI 技术简介：</span>
          {item.aiSummary.overview}
        </p>

        <div className="mt-3 border-l-2 border-emerald-500 bg-emerald-50/60 px-3 py-2">
          <p className="text-[10px] font-semibold text-emerald-700">与当前项目的关系</p>
          <p className="mt-1 text-[11px] leading-5 text-slate-600">{item.projectRelevance}</p>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <span
              key={tag.id}
              className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600"
            >
              {tag.label}
            </span>
          ))}
        </div>

        <div className="mt-4 grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
          <div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">相关度</span>
              <span className="font-semibold text-blue-700">{item.recommendationScore}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded bg-slate-100">
              <div
                className="h-full bg-blue-600"
                style={{ width: `${item.recommendationScore}%` }}
              />
            </div>
          </div>
          <div className="text-[10px] leading-4 text-slate-500">
            <span className="font-semibold text-slate-800">{item.recommendation.level}：</span>
            {item.recommendationReason}
          </div>
        </div>

        <div className="mt-auto flex flex-wrap gap-1.5 border-t border-border pt-4">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenDemoLink(item)}>
            <ExternalLink className="h-3.5 w-3.5" />
            原链接
          </Button>
          <Button
            type="button"
            variant={isWatchLater ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onToggleWatchLater(item.id)}
          >
            <Clock3 className="h-3.5 w-3.5" />
            {isWatchLater ? "已待看" : "加入待看"}
          </Button>
          <Button
            type="button"
            variant={item.isFavorite ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onToggleFavorite(item.id)}
          >
            <Star className={cn("h-3.5 w-3.5", item.isFavorite && "fill-amber-400 text-amber-500")} />
            {item.isFavorite ? "已收藏" : "收藏"}
          </Button>
          <Button
            type="button"
            variant={isCompleted ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onToggleCompleted(item.id)}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {isCompleted ? "已完成" : "完成"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => onShowSummary(item)}>
            <BrainCircuit className="h-3.5 w-3.5" />
            AI 总结
          </Button>
          <Button
            type="button"
            variant={item.isInKnowledgeBase ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onAddToKnowledgeBase(item.id)}
          >
            <BookPlus className="h-3.5 w-3.5" />
            {item.isInKnowledgeBase ? "已入库" : "知识库"}
          </Button>
          <Button
            type="button"
            variant={item.isInStudyPlan ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onAddToStudyPlan(item.id)}
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            {item.isInStudyPlan ? "已加计划" : "学习计划"}
          </Button>
        </div>
      </div>
    </article>
  );
}
