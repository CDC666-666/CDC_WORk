import type { Metadata } from "next";

import { TaskManager } from "@/components/tasks/task-manager";

export const metadata: Metadata = { title: "今日任务", description: "个人任务计划与执行管理" };

export default async function TodayPage({ searchParams }: { searchParams: Promise<{ create?: string }> }) {
  const params = await searchParams;
  return <TaskManager openCreate={params.create === "1"} />;
}

