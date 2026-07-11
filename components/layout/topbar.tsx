"use client";

import { useEffect, useState } from "react";
import { Bell, Database, Menu, Search, Wifi } from "lucide-react";

interface TopbarProps {
  onMenuClick: () => void;
}

function formatClock(date: Date | null) {
  if (!date) {
    return { date: "-- / --", time: "--:--" };
  }

  return {
    date: new Intl.DateTimeFormat("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    }).format(date),
    time: new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date),
  };
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const updateClock = () => setNow(new Date());
    updateClock();
    const timer = window.setInterval(updateClock, 30_000);

    return () => window.clearInterval(timer);
  }, []);

  const clock = formatClock(now);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border bg-[#0b0e0f]/95 px-4 backdrop-blur-sm sm:px-6 lg:px-7">
      <button
        type="button"
        className="mr-3 grid h-9 w-9 shrink-0 place-items-center rounded-sm text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden"
        aria-label="打开导航"
        title="打开导航"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex min-w-0 items-center gap-2">
        <span className="hidden font-mono text-[10px] text-muted-foreground sm:inline">
          RM-STD-26
        </span>
        <span className="hidden text-border sm:inline">/</span>
        <span className="truncate text-sm font-medium text-foreground">工作台总览</span>
      </div>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <div className="mr-1 hidden h-8 items-center gap-4 border-r border-border pr-4 xl:flex">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Wifi className="h-3.5 w-3.5 text-emerald-300" />
            本地模式
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Database className="h-3.5 w-3.5 text-amber-300" />
            模拟数据
          </span>
        </div>

        <button
          type="button"
          className="grid h-9 w-9 place-items-center rounded-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label="搜索"
          title="搜索"
        >
          <Search className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="relative grid h-9 w-9 place-items-center rounded-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label="通知"
          title="通知"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-amber-300" />
        </button>

        <div className="ml-1 hidden min-w-[88px] border-l border-border pl-3 text-right sm:block">
          <p className="font-mono text-xs text-foreground">{clock.time}</p>
          <p className="text-[10px] text-muted-foreground">{clock.date}</p>
        </div>
      </div>
    </header>
  );
}
