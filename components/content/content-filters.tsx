import { LayoutGrid, List, RotateCcw, Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  contentTypeLabels,
  directionLabels,
  sourceLabels,
  statusLabels,
} from "@/lib/content";
import type {
  ContentFilters,
  ContentSource,
  ContentStatus,
  ContentType,
  ContentViewMode,
  TechnicalDirection,
  TechnicalTag,
} from "@/types/content";

interface ContentFiltersPanelProps {
  filters: ContentFilters;
  resultCount: number;
  tags: TechnicalTag[];
  viewMode: ContentViewMode;
  onChange: (changes: Partial<ContentFilters>) => void;
  onClear: () => void;
  onViewModeChange: (mode: ContentViewMode) => void;
}

interface FilterSelectProps {
  ariaLabel: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}

function FilterSelect({ ariaLabel, value, options, onChange }: FilterSelectProps) {
  return (
    <select
      aria-label={ariaLabel}
      className="h-9 min-w-0 rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-700 shadow-sm"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function ContentFiltersPanel({
  filters,
  resultCount,
  tags,
  viewMode,
  onChange,
  onClear,
  onViewModeChange,
}: ContentFiltersPanelProps) {
  return (
    <section className="rounded-lg border border-border bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            aria-label="搜索技术内容"
            className="h-10 rounded-lg border-slate-200 bg-slate-50 pl-9 text-slate-800"
            placeholder="搜索 RoboMaster、STM32、电机控制、OpenCV、C++..."
            value={filters.query}
            onChange={(event) => onChange({ query: event.target.value })}
          />
        </div>
        <div className="flex items-center justify-between gap-3 lg:justify-end">
          <span className="text-xs text-slate-500">找到 {resultCount} 条</span>
          <div className="flex rounded-md border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              className={`grid h-8 w-8 place-items-center rounded ${
                viewMode === "card" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"
              }`}
              aria-label="卡片视图"
              title="卡片视图"
              onClick={() => onViewModeChange("card")}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={`grid h-8 w-8 place-items-center rounded ${
                viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"
              }`}
              aria-label="列表视图"
              title="列表视图"
              onClick={() => onViewModeChange("list")}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-3 border-t border-border pt-4">
        <SlidersHorizontal className="mt-2.5 h-4 w-4 shrink-0 text-slate-400" />
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-7">
          <FilterSelect
            ariaLabel="来源平台"
            value={filters.source}
            options={[
              { label: "全部平台", value: "all" },
              ...Object.entries(sourceLabels).map(([value, label]) => ({ value, label })),
            ]}
            onChange={(value) => onChange({ source: value as ContentSource | "all" })}
          />
          <FilterSelect
            ariaLabel="内容类型"
            value={filters.contentType}
            options={[
              { label: "全部类型", value: "all" },
              ...Object.entries(contentTypeLabels).map(([value, label]) => ({ value, label })),
            ]}
            onChange={(value) => onChange({ contentType: value as ContentType | "all" })}
          />
          <FilterSelect
            ariaLabel="发布时间"
            value={filters.timeRange}
            options={[
              { label: "全部时间", value: "all" },
              { label: "最近一周", value: "week" },
              { label: "最近一个月", value: "month" },
              { label: "最近一年", value: "year" },
            ]}
            onChange={(value) =>
              onChange({ timeRange: value as ContentFilters["timeRange"] })
            }
          />
          <FilterSelect
            ariaLabel="技术方向"
            value={filters.direction}
            options={[
              { label: "全部方向", value: "all" },
              ...Object.entries(directionLabels).map(([value, label]) => ({ value, label })),
            ]}
            onChange={(value) =>
              onChange({ direction: value as TechnicalDirection | "all" })
            }
          />
          <FilterSelect
            ariaLabel="技术标签"
            value={filters.tag}
            options={[
              { label: "全部标签", value: "all" },
              ...tags.map((tag) => ({ label: tag.label, value: tag.id })),
            ]}
            onChange={(value) => onChange({ tag: value })}
          />
          <FilterSelect
            ariaLabel="处理状态"
            value={filters.status}
            options={[
              { label: "全部状态", value: "all" },
              ...Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
            ]}
            onChange={(value) => onChange({ status: value as ContentStatus | "all" })}
          />
          <FilterSelect
            ariaLabel="排序方式"
            value={filters.sort}
            options={[
              { label: "按相关度", value: "relevance" },
              { label: "按发布时间", value: "publishedAt" },
              { label: "按推荐指数", value: "recommendation" },
              { label: "按学习时长", value: "duration" },
            ]}
            onChange={(value) => onChange({ sort: value as ContentFilters["sort"] })}
          />
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          <RotateCcw className="h-3.5 w-3.5" />
          清除全部筛选
        </Button>
      </div>
    </section>
  );
}
