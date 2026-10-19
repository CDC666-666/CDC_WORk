import { redirect } from "next/navigation";
export default async function LogsPage({ searchParams }: { searchParams: Promise<{ record?: string; projectId?: string; taskId?: string; create?: string }> }) {
  const params = await searchParams;
  const next = new URLSearchParams();
  if (params.record) next.set("record", params.record);
  if (params.projectId) next.set("projectId", params.projectId);
  if (params.taskId) next.set("taskId", params.taskId);
  if (params.create === "1") next.set("create", "log");
  redirect(`/experiences${next.size ? `?${next}` : ""}`);
}

