import { localContentStateRepository, type ContentStateRepository } from "@/repositories/content-state-repository";
import type { ContentItem, PersistedContentState } from "@/types/content";

function buildPersistedState(items: ContentItem[]): PersistedContentState {
  return {
    version: 1,
    items: Object.fromEntries(items.map((item) => [item.id, {
      status: item.status,
      isFavorite: item.isFavorite,
      isInKnowledgeBase: item.isInKnowledgeBase,
      isInStudyPlan: item.isInStudyPlan,
    }])),
  };
}

export interface ContentStateService {
  load(initialItems: ContentItem[]): Promise<ContentItem[]>;
  save(items: ContentItem[]): Promise<boolean>;
}

export function createContentStateService(repository: ContentStateRepository): ContentStateService {
  let pendingSave: Promise<void> = Promise.resolve();

  return {
    async load(initialItems) {
      const persistedState = await repository.read();
      if (!persistedState) return initialItems;
      return initialItems.map((item) => {
        const persisted = persistedState.items[item.id];
        return persisted ? { ...item, ...persisted } : item;
      });
    },
    save(items) {
      const state = buildPersistedState(items);
      const result = pendingSave.then(() => repository.write(state));
      pendingSave = result.then(() => undefined, () => undefined);
      return result;
    },
  };
}

export const contentStateService = createContentStateService(localContentStateRepository);
