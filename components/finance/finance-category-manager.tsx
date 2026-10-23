"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FinanceCategorySetting } from "@/types/finance";

export function FinanceCategoryManager({ categories, onChanged }: { categories: FinanceCategorySetting[]; onChanged(): Promise<void> }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#2563eb");
  const [error, setError] = useState("");
  const mutate = async (method: "POST" | "PATCH" | "DELETE", body: Record<string, string>) => {
    try {
      const response = await fetch("/api/private/finance/categories", { method, headers: { "Content-Type": "application/json" },
        credentials: "same-origin", body: JSON.stringify(body) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "分类保存失败。");
      await onChanged();
      setError("");
    } catch (cause: unknown) { setError(cause instanceof Error ? cause.message : "分类保存失败。"); }
  };
  return <details className="rounded-lg border bg-white p-4"><summary className="cursor-pointer text-sm font-semibold">管理自定义分类和颜色</summary>
    <form className="mt-4 flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); if (name.trim()) {
      void mutate("POST", { name: name.trim(), color }).then(() => setName(""));
    } }}>
      <Input aria-label="新分类名称" className="w-40" value={name} onChange={(event) => setName(event.target.value)} placeholder="分类名称" />
      <input aria-label="新分类颜色" type="color" className="h-10 w-12 cursor-pointer" value={color} onChange={(event) => setColor(event.target.value)} />
      <Button type="submit" size="sm">新增分类</Button>
    </form>
    <div className="mt-3 flex flex-wrap gap-2">{categories.map((category) => <div key={category.name} className="flex items-center gap-1 rounded border px-2 py-1 text-xs">
      <input aria-label={category.name + "颜色"} type="color" className="h-6 w-7 cursor-pointer" defaultValue={category.color}
        onBlur={(event) => { if (event.target.value !== category.color) void mutate("PATCH", { previous: category.name, name: category.name, color: event.target.value }); }} />
      <span>{category.name}</span>
      <button type="button" className="text-blue-700" onClick={() => { const next = window.prompt("分类新名称", category.name);
        if (next?.trim() && next.trim() !== category.name) void mutate("PATCH", { previous: category.name, name: next.trim(), color: category.color }); }}>重命名</button>
      {category.name !== "未分类" && <button type="button" className="text-rose-700" onClick={() => { if (window.confirm("删除「" + category.name + "」？该分类的历史账单将归入「未分类」。"))
        void mutate("DELETE", { name: category.name, migrateTo: "未分类" }); }}>删除</button>
      }
    </div>)}</div>
    {error && <p role="alert" className="mt-2 text-xs text-rose-700">{error}</p>}
  </details>;
}
