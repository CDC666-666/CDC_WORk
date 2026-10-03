import type { Metadata } from "next";
import { ProjectDetail } from "@/components/projects/project-detail";
export const metadata: Metadata = { title: "项目详情" };
export default async function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) { const { projectId } = await params; return <ProjectDetail projectId={projectId} />; }

