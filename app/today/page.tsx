import type { Metadata } from "next";

import { TaskManager } from "@/components/tasks/task-manager";

export const metadata: Metadata = { title: "今日任务", description: "个人任务计划与执行管理" };

export default function TodayPage() {
  return <TaskManager />;
}

