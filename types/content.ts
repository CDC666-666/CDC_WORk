export type ContentSource =
  | "bilibili"
  | "douyin"
  | "csdn"
  | "github"
  | "blog";

export type ContentType = "video" | "article" | "repository";

export type ContentStatus =
  | "unprocessed"
  | "watchLater"
  | "summarized"
  | "favorite"
  | "completed";

export type TechnicalDirection =
  | "robomaster"
  | "embedded"
  | "vision"
  | "control"
  | "software"
  | "learning";

export interface TechnicalTag {
  id: string;
  label: string;
  direction: TechnicalDirection;
}

export interface AiSummary {
  overview: string;
  keyPoints: string[];
  learningOutcome: string;
}

export interface Recommendation {
  score: number;
  level: "强烈推荐" | "推荐" | "一般";
  reason: string;
}

export interface ContentItem {
  id: string;
  title: string;
  source: ContentSource;
  contentType: ContentType;
  author: string;
  publishedAt: string;
  thumbnailUrl: string;
  originalUrl: string;
  durationMinutes: number;
  rawDescription: string;
  aiSummary: AiSummary;
  projectRelevance: string;
  recommendationScore: number;
  recommendationReason: string;
  recommendation: Recommendation;
  tags: TechnicalTag[];
  status: ContentStatus;
  isFavorite: boolean;
  isInKnowledgeBase: boolean;
  isInStudyPlan: boolean;
  addedAt: string;
}

export type ContentTimeRange = "all" | "week" | "month" | "year";
export type ContentSort = "relevance" | "publishedAt" | "recommendation" | "duration";
export type ContentViewMode = "card" | "list";

export interface ContentFilters {
  query: string;
  source: ContentSource | "all";
  contentType: ContentType | "all";
  timeRange: ContentTimeRange;
  direction: TechnicalDirection | "all";
  tag: string | "all";
  status: ContentStatus | "all";
  sort: ContentSort;
}

export interface PersistedContentState {
  version: 1;
  items: Record<
    string,
    Pick<
      ContentItem,
      "status" | "isFavorite" | "isInKnowledgeBase" | "isInStudyPlan"
    >
  >;
}
