"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[calc(100vh-150px)] items-center justify-center">
      <div className="max-w-lg border border-rose-200 bg-white p-8 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-rose-500" />
        <h1 className="mt-4 text-lg font-semibold text-slate-900">页面暂时无法加载</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          本地演示数据加载失败。请重试；如果问题持续存在，再检查开发服务器输出。
        </p>
        <Button type="button" className="mt-6" onClick={reset}>
          <RotateCcw className="h-4 w-4" />
          重新加载
        </Button>
      </div>
    </div>
  );
}
