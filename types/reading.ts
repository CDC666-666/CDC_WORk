export type ReadingStatus = "待读" | "阅读中" | "已完成" | "已暂停";
export type ReadingCategory =
  | "专业技术"
  | "课程教材"
  | "产品管理"
  | "创业商业"
  | "文学通识"
  | "其他";

export interface ReadingItem {
  id: string;
  title: string;
  author: string;
  category: ReadingCategory;
  totalPages: number;
  currentPage: number;
  dailyPageTarget: number;
  startDate: string;
  targetDate: string;
  status: ReadingStatus;
  rating: number;
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export type ReadingItemDraft = Omit<ReadingItem, "id" | "createdAt" | "updatedAt" | "completedAt">;

