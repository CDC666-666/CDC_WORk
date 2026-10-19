import type { Metadata } from "next";
import { ReflectionsCenter } from "@/components/reflections/reflections-center";

export const metadata: Metadata = { title: "总结与复盘", description: "每日、每周、每月与项目复盘" };

export default async function ReflectionsPage({ searchParams }: {
  searchParams: Promise<{ projectId?: string; reviewId?: string; date?: string; create?: string }>;
}) {
  const { projectId, reviewId, date, create } = await searchParams;
  return <ReflectionsCenter initialProjectId={projectId ?? ""} initialReviewId={reviewId ?? ""}
    initialDate={date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined} openCreate={create === "1"} />;
}
