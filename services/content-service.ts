import { demoDataRepository } from "@/repositories/demo-data-repository";
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
  return demoDataRepository.readContentItems().map(cloneContentItem);
}

export async function getTechnicalTags(): Promise<TechnicalTag[]> {
  return Object.values(demoDataRepository.readTechnicalTags()).map((tag) => ({ ...tag }));
}
