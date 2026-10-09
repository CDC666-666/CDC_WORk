import type { Metadata } from "next";
import { WorkLogCenter } from "@/components/engineering/work-log-center";
export const metadata: Metadata = { title: "工程日志" };
export default async function LogsPage({ searchParams }: { searchParams: Promise<{ projectId?: string; taskId?: string; create?: string }> }) { const params = await searchParams; return <WorkLogCenter initialProjectId={params.projectId} initialTaskId={params.taskId} openCreate={params.create === "1"} />; }

