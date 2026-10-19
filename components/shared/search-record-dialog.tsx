"use client";

import { useRouter } from "next/navigation";
import { Dialog } from "@/components/shared/dialog";
import { Button } from "@/components/ui/button";
import { useWorkspaceData } from "@/hooks/use-workspace-data";

export function SearchRecordDialog({ id, kind }: { id?: string; kind: "knowledge" | "review" }) {
  const router = useRouter();
  const { data } = useWorkspaceData();
  const knowledge = kind === "knowledge" ? data.knowledgeItems.find((item) => item.id === id) : undefined;
  const issue = kind === "review" ? data.technicalIssues.find((item) => item.id === id) : undefined;
  const test = kind === "review" ? data.testRecords.find((item) => item.id === id) : undefined;
  const record = knowledge ?? issue ?? test;
  const close = () => router.replace(kind === "knowledge" ? "/knowledge" : "/reviews", { scroll: false });
  const content = knowledge ? `${knowledge.summary}\n\n${knowledge.content}` : issue ?
    `${issue.phenomenon}\n\n根因：${issue.rootCause}` : test ?
      `${test.objective}\n\n结论：${test.conclusion}` : "";
  return <Dialog open={Boolean(id && record)} title={record?.title ?? "记录"} onClose={close} size="lg"
    footer={<Button variant="outline" onClick={close}>关闭</Button>}>
    {record && <div className="space-y-3 whitespace-pre-wrap break-words text-sm leading-6">
      <p>{content}</p>
      {knowledge?.tags.length ? <p className="text-xs text-slate-500">标签：{knowledge.tags.join("、")}</p> : null}
    </div>}
  </Dialog>;
}
