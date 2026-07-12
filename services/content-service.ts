import { mockContentItems, technicalTags } from "@/data/mock-content";
import type { ContentItem, TechnicalTag } from "@/types/content";

function cloneContentItem(item: ContentItem): ContentItem {
  return {
    ...item,
    aiSummary: {
      ...item.aiSummary,
      keyPoints: [...item.aiSummary.keyPoints],
    },
    recommendation: { ...item.recommendation },
    tags: item.tags.map((tag) => ({ ...tag })),
  };
}

export async function getContentItems(): Promise<ContentItem[]> {
  return mockContentItems.map(cloneContentItem);
}

export async function getTechnicalTags(): Promise<TechnicalTag[]> {
  return Object.values(technicalTags).map((tag) => ({ ...tag }));
}
