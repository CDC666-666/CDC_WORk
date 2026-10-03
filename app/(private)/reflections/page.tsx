import type { Metadata } from "next";
import { ReflectionsCenter } from "@/components/reflections/reflections-center";

export const metadata: Metadata = { title: "总结与复盘", description: "每日、每周、每月与项目复盘" };

export default async function ReflectionsPage({ searchParams }: {
  searchParams: Promise<{ projectId?: string; reviewId?: string }>;
}) {
  const { projectId, reviewId } = await searchParams;
  return <ReflectionsCenter initialProjectId={projectId ?? ""} initialReviewId={reviewId ?? ""} />;
}
