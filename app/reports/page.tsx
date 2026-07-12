import type { Metadata } from "next"; import { ReportCenter } from "@/components/reports/report-center";
export const metadata: Metadata = { title: "报告中心" }; export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ projectId?: string }> }) { const params = await searchParams; return <ReportCenter initialProjectId={params.projectId} />; }

