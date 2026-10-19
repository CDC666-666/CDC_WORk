import type { Metadata } from "next"; import { ReviewCenter } from "@/components/reviews/review-center";
import { SearchRecordDialog } from "@/components/shared/search-record-dialog";
export const metadata: Metadata = { title: "测试与复盘" };
export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ projectId?: string; create?: "test" | "issue"; record?: string }> }) { const params = await searchParams; return <><ReviewCenter initialProjectId={params.projectId} openCreate={params.create} /><SearchRecordDialog kind="review" id={params.record} /></>; }

