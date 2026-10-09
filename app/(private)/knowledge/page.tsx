import type { Metadata } from "next"; import { KnowledgeCenter } from "@/components/knowledge/knowledge-center";
export const metadata: Metadata = { title: "知识库" };
export default async function KnowledgePage({ searchParams }: { searchParams: Promise<{ projectId?: string }> }) { const params = await searchParams; return <KnowledgeCenter initialProjectId={params.projectId} />; }

