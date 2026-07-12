"use client";

import { useState } from "react";
import { Bot, SendHorizontal, Sparkles } from "lucide-react";

import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const suggestedPrompts = [
  "总结今天的学习",
  "制定本周计划",
  "整理 RoboMaster 调试记录",
  "生成阅读计划",
  "分析最近收藏的技术内容",
];

function createDemoResponse(prompt: string) {
  if (prompt.includes("RoboMaster")) {
    return "已识别为项目复盘任务。Sprint 1 仅生成演示反馈，后续会从工程日志中提取现象、原因、方案和验证结果。";
  }
  if (prompt.includes("阅读")) {
    return "已识别为阅读规划任务。建议先确定目标日期、每日页数和输出笔记，本阶段不会调用外部模型。";
  }
  if (prompt.includes("收藏")) {
    return "已识别为技术内容整理任务。可以前往“视频与技术内容”按相关度筛选并查看演示 AI 技术简介。";
  }
  return "输入已保留在当前页面。Sprint 1 未连接真实 AI，后续将基于课程、任务和项目数据生成结构化结果。";
}

export function AiCommand() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<string | null>(null);

  const submitPrompt = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedPrompt = prompt.trim();
    if (!normalizedPrompt) return;
    setResponse(createDemoResponse(normalizedPrompt));
  };

  return (
    <Card className="h-full rounded-lg border-blue-100 bg-white shadow-sm">
      <CardHeader className="border-b border-border p-5">
        <SectionHeader
          title="AI 快捷输入"
          description="前端模拟响应，不连接真实模型"
          action={
            <span className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-[9px] font-semibold text-blue-700">
              DEMO
            </span>
          }
        />
      </CardHeader>
      <CardContent className="p-5">
        <form onSubmit={submitPrompt}>
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Bot className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-600" />
              <Input
                aria-label="AI 快捷输入"
                className="h-11 rounded-lg border-slate-200 bg-slate-50 pl-10 text-slate-800"
                placeholder="输入学习或工程问题"
                value={prompt}
                onChange={(event) => {
                  setPrompt(event.target.value);
                  setResponse(null);
                }}
              />
            </div>
            <Button type="submit" size="icon" className="h-11 w-11" disabled={!prompt.trim()}>
              <SendHorizontal className="h-4 w-4" />
              <span className="sr-only">提交演示问题</span>
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            {suggestedPrompts.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                onClick={() => {
                  setPrompt(suggestion);
                  setResponse(null);
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </form>

        {response ? (
          <div className="mt-5 border-l-2 border-blue-500 bg-blue-50/60 px-3 py-3" aria-live="polite">
            <p className="text-[10px] font-semibold text-blue-700">模拟响应</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">{response}</p>
          </div>
        ) : (
          <div className="mt-5 border-t border-border pt-4 text-[11px] leading-5 text-slate-400">
            输入内容只保存在当前浏览器状态，不会发送到任何外部服务。
          </div>
        )}
      </CardContent>
    </Card>
  );
}
