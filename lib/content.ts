import type {
  ContentFilters,
  ContentItem,
  ContentSource,
  ContentStatus,
  ContentType,
  TechnicalDirection,
} from "@/types/content";

export const sourceLabels: Record<ContentSource, string> = {
  bilibili: "Bilibili",
  douyin: "抖音",
  csdn: "CSDN",
  github: "GitHub",
  blog: "技术博客",
};

export const contentTypeLabels: Record<ContentType, string> = {
  video: "视频",
  article: "文章",
  repository: "开源项目",
};

export const statusLabels: Record<ContentStatus, string> = {
  unprocessed: "未处理",
  watchLater: "待观看",
  summarized: "已总结",
  favorite: "已收藏",
  completed: "已完成",
};

export const directionLabels: Record<TechnicalDirection, string> = {
  robomaster: "RoboMaster",
  embedded: "嵌入式",
  vision: "视觉",
  control: "控制",
  software: "软件",
  learning: "学习方法",
};

export const defaultContentFilters: ContentFilters = {
  query: "",
  source: "all",
  contentType: "all",
  timeRange: "all",
  direction: "all",
  tag: "all",
  status: "all",
  sort: "relevance",
};

function matchesTimeRange(item: ContentItem, timeRange: ContentFilters["timeRange"]) {
  if (timeRange === "all") return true;

  const publishedAt = new Date(item.publishedAt).getTime();
  const now = Date.now();
  const ranges = {
    week: 7 * 24 * 60 * 60 * 1000,
    month: 31 * 24 * 60 * 60 * 1000,
    year: 366 * 24 * 60 * 60 * 1000,
  };

  return now - publishedAt <= ranges[timeRange];
}

function matchesStatus(item: ContentItem, status: ContentFilters["status"]) {
  if (status === "all") return true;
  if (status === "favorite") return item.isFavorite;
  return item.status === status;
}

export function filterAndSortContent(items: ContentItem[], filters: ContentFilters) {
  const normalizedQuery = filters.query.trim().toLocaleLowerCase("zh-CN");

  return [...items]
    .filter((item) => {
      const searchableText = [
        item.title,
        item.author,
        item.rawDescription,
        item.aiSummary.overview,
        item.projectRelevance,
        ...item.tags.map((tag) => tag.label),
      ]
        .join(" ")
        .toLocaleLowerCase("zh-CN");

      return (
        (!normalizedQuery || searchableText.includes(normalizedQuery)) &&
        (filters.source === "all" || item.source === filters.source) &&
        (filters.contentType === "all" || item.contentType === filters.contentType) &&
        matchesTimeRange(item, filters.timeRange) &&
        (filters.direction === "all" ||
          item.tags.some((tag) => tag.direction === filters.direction)) &&
        (filters.tag === "all" || item.tags.some((tag) => tag.id === filters.tag)) &&
        matchesStatus(item, filters.status)
      );
    })
    .sort((left, right) => {
      if (filters.sort === "publishedAt") {
        return new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime();
      }
      if (filters.sort === "recommendation") {
        return right.recommendation.score - left.recommendation.score;
      }
      if (filters.sort === "duration") {
        return left.durationMinutes - right.durationMinutes;
      }
      return right.recommendationScore - left.recommendationScore;
    });
}

export function getContentStatistics(items: ContentItem[]) {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return {
    weeklyAdded: items.filter((item) => new Date(item.addedAt).getTime() >= weekAgo).length,
    pending: items.filter((item) =>
      ["unprocessed", "watchLater"].includes(item.status),
    ).length,
    summarized: items.filter((item) => item.status === "summarized").length,
    knowledgeBase: items.filter((item) => item.isInKnowledgeBase).length,
  };
}
