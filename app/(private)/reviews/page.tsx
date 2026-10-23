import type { Metadata } from "next"; import { ReviewCenter } from "@/components/reviews/review-center";
import { SearchRecordDialog } from "@/components/shared/search-record-dialog";
export const metadata: Metadata = { title: "测试与复盘" };
export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ projectId?: string; create?: "test" | "issue"; tab?: "tests" | "issues"; record?: string }> }) { const params = await searchParams; const tab = params.tab === "issues" ? "issues" : "tests"; return <><ReviewCenter key={`${params.projectId ?? ""}:${params.create ?? ""}:${tab}`} initialProjectId={params.projectId} initialTab={tab} openCreate={params.create} /><SearchRecordDialog kind="review" id={params.record} /></>; }

