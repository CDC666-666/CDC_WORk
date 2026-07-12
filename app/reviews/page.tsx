import type { Metadata } from "next"; import { ReviewCenter } from "@/components/reviews/review-center";
export const metadata: Metadata = { title: "测试与复盘" };
export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ projectId?: string; create?: "test" | "issue" }> }) { const params = await searchParams; return <ReviewCenter initialProjectId={params.projectId} openCreate={params.create} />; }

