"use client";

import { useEffect, useState } from "react";
import { useBranding } from "@/components/providers/branding-provider";


function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "早上好";
  if (hour < 14) return "中午好";
  if (hour < 18) return "下午好";
  return "晚上好";
}

export function DashboardHeader() {
  const { branding } = useBranding();
  const [greeting, setGreeting] = useState("你好");

  useEffect(() => setGreeting(getGreeting()), []);

  return (
    <section className="border-b border-border bg-white px-5 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <p className="mb-3 text-xs text-slate-500">{branding.workspaceSubtitle}</p>
          <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
            {greeting}，{branding.displayName}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {branding.bio}
          </p>
        </div>

      </div>
    </section>
  );
}
