import type { Visibility } from "@/types/project";

export interface Timeline {
  id: string;
  date: string;
  title: string;
  description: string;
  tags: string[];
  relatedProjectId?: string;
  visibility: Visibility;
}
