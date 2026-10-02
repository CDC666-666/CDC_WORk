"use client";

import { useEffect, useState } from "react";

import { contentStateService } from "@/services/content-state-service";
import type { ContentItem } from "@/types/content";

export function useContentItems(initialItems: ContentItem[]) {
  const [items, setItems] = useState(initialItems);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    void contentStateService.load(initialItems).then((loaded) => {
      if (!active) return;
      setItems(loaded);
      setIsHydrated(true);
    });
    return () => { active = false; };
  }, [initialItems]);

  useEffect(() => {
    if (isHydrated) void contentStateService.save(items);
  }, [isHydrated, items]);

  return { items, setItems };
}
