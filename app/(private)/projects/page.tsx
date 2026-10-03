import type { Metadata } from "next";
import { ProjectCenter } from "@/components/projects/project-center";
export const metadata: Metadata = { title: "我的项目", description: "统一项目组合与工程数据主线" };
export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ create?: string }> }) { const params = await searchParams; return <ProjectCenter openCreate={params.create === "1"} />; }
