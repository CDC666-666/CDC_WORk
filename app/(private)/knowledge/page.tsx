import type { Metadata } from "next"; import { KnowledgeCenter } from "@/components/knowledge/knowledge-center";
import { SearchRecordDialog } from "@/components/shared/search-record-dialog";
export const metadata: Metadata = { title: "知识库" };
export default async function KnowledgePage({ searchParams }: { searchParams: Promise<{ projectId?: string; record?: string }> }) { const params = await searchParams; return <><KnowledgeCenter initialProjectId={params.projectId} /><SearchRecordDialog kind="knowledge" id={params.record} /></>; }

