import type { Metadata } from "next";

import { ContentCenter } from "@/components/content/content-center";
import { getContentItems, getTechnicalTags } from "@/services/content-service";

export const metadata: Metadata = {
  title: "视频与技术内容",
  description: "发现、筛选和整理与学习及工程项目相关的技术内容",
};

export default async function ContentPage() {
  const [items, tags] = await Promise.all([getContentItems(), getTechnicalTags()]);
  return <ContentCenter initialItems={items} tags={tags} />;
}
