import { Bot, SendHorizontal, Sparkles, TerminalSquare } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const suggestedPrompts = [
  "分析今天的电机测试记录",
  "生成本周工程周报",
  "整理力控底盘问题清单",
];

export function AiCommand() {
  return (
    <Card
      className="panel-topline animate-panel-enter overflow-hidden border-cyan-300/15 bg-[#0d1213] motion-reduce:animate-none"
      style={{ animationDelay: "360ms" }}
    >
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
          <div className="flex min-w-0 items-start gap-3 xl:w-[285px] xl:shrink-0">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-sm border border-cyan-300/25 bg-cyan-300/10 text-cyan-300">
              <Bot className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">AI 工程助手</h2>
                <Badge variant="outline" className="font-mono">
                  UI PREVIEW
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">本地界面 · 暂未接入模型</p>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <TerminalSquare className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label="AI 工程助手输入"
                  className="h-11 border-cyan-300/15 bg-black/20 pl-10 pr-3"
                  placeholder="输入工程问题，例如：分析底盘高速换向振荡原因"
                />
              </div>
              <Button
                type="button"
                size="icon"
                className="h-11 w-11 shrink-0"
                disabled
                title="后续 Sprint 接入"
                aria-label="发送（后续 Sprint 接入）"
              >
                <SendHorizontal className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled
                  title="后续 Sprint 接入"
                  className="rounded-sm border border-border bg-secondary/45 px-2.5 py-1 text-[11px] text-muted-foreground disabled:cursor-not-allowed disabled:opacity-75"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
