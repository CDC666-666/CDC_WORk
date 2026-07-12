"use client";

import { BrainCircuit, CheckCircle2, Lightbulb, Target, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { sourceLabels } from "@/lib/content";
import type { ContentItem } from "@/types/content";

interface ContentSummaryDialogProps {
  item: ContentItem | null;
  onClose: () => void;
  onAddToKnowledgeBase: (itemId: string) => void;
}

export function ContentSummaryDialog({
  item,
  onClose,
  onAddToKnowledgeBase,
}: ContentSummaryDialogProps) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="关闭 AI 总结"
        className="absolute inset-0 bg-slate-950/40"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="summary-dialog-title"
        className="relative z-10 max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-white shadow-[0_26px_90px_rgba(15,23,42,0.28)]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
              <span className="font-semibold text-blue-600">演示 AI 技术总结</span>
              <span>·</span>
              <span>{sourceLabels[item.source]}</span>
            </div>
            <h2 id="summary-dialog-title" className="mt-2 text-lg font-semibold text-slate-950">
              {item.title}
            </h2>
          </div>
          <button
            type="button"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="关闭"
            title="关闭"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-6 px-5 py-5 sm:px-6">
          <div className="border-l-2 border-blue-500 bg-blue-50/60 px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
              <BrainCircuit className="h-4 w-4" />
              技术简介
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-700">{item.aiSummary.overview}</p>
          </div>

          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              关键要点
            </h3>
            <ul className="mt-3 space-y-2">
              {item.aiSummary.keyPoints.map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm leading-6 text-slate-600">
                  <CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border border-slate-200 p-4">
              <p className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <Target className="h-4 w-4 text-blue-600" />
                与当前项目的关系
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">{item.projectRelevance}</p>
            </div>
            <div className="border border-slate-200 p-4">
              <p className="text-xs font-semibold text-slate-800">预期学习产出</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {item.aiSummary.learningOutcome}
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-3 border-t border-border pt-4 sm:flex-row sm:items-center">
            <p className="text-xs text-slate-500">
              推荐指数 <span className="font-semibold text-blue-700">{item.recommendationScore}%</span>
              <span className="mx-2 text-slate-300">·</span>
              {item.recommendation.level}
            </p>
            <Button
              type="button"
              onClick={() => onAddToKnowledgeBase(item.id)}
              disabled={item.isInKnowledgeBase}
            >
              {item.isInKnowledgeBase ? "已加入知识库" : "加入知识库"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
