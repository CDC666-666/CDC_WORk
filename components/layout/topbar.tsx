"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CheckSquare2,
  ChevronDown,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { navigationItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface TopbarProps {
  isSidebarCollapsed: boolean;
  onMenuClick: () => void;
  onNotify: (title: string, description: string) => void;
  onToggleSidebar: () => void;
}

const quickActions = [
  {
    label: "新建任务",
    description: "记录一项今天要完成的事情",
    icon: CheckSquare2,
  },
  {
    label: "记录学习",
    description: "添加课程或阅读进度",
    icon: BookOpen,
  },
  {
    label: "询问 AI",
    description: "打开 AI 助手输入入口",
    icon: Sparkles,
  },
];

function formatDate(date: Date | null) {
  if (!date) {
    return { date: "--", weekday: "--", time: "--:--" };
  }

  return {
    date: new Intl.DateTimeFormat("zh-CN", {
      month: "long",
      day: "numeric",
    }).format(date),
    weekday: new Intl.DateTimeFormat("zh-CN", { weekday: "long" }).format(date),
    time: new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date),
  };
}

export function Topbar({
  isSidebarCollapsed,
  onMenuClick,
  onNotify,
  onToggleSidebar,
}: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [now, setNow] = useState<Date | null>(null);
  const [query, setQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickOpen, setIsQuickOpen] = useState(false);

  useEffect(() => {
    const updateClock = () => setNow(new Date());
    updateClock();
    const timer = window.setInterval(updateClock, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const date = formatDate(now);
  const currentItem = navigationItems.find((item) => item.href === pathname);
  const normalizedQuery = query.trim().toLocaleLowerCase("zh-CN");
  const searchResults = normalizedQuery
    ? navigationItems.filter((item) =>
        `${item.label} ${item.description}`
          .toLocaleLowerCase("zh-CN")
          .includes(normalizedQuery),
      )
    : navigationItems.slice(0, 7);

  const navigateTo = (href: string) => {
    setIsSearchOpen(false);
    setQuery("");
    router.push(href);
  };

  const runQuickAction = (label: string) => {
    setIsQuickOpen(false);

    if (label === "询问 AI") {
      router.push("/assistant");
      return;
    }

    onNotify(`${label}已打开`, "Sprint 1 使用演示反馈，后续将在对应模块保存真实数据。 ");
  };

  const searchPanel = (
    <div className="rounded-lg border border-border bg-white p-2 shadow-[0_18px_55px_rgba(15,23,42,0.16)]">
      <div className="max-h-80 overflow-y-auto">
        {searchResults.map((item) => (
          <button
            key={item.href}
            type="button"
            className="group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left hover:bg-slate-100"
            onClick={() => navigateTo(item.href)}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-800">{item.label}</p>
              <p className="mt-0.5 truncate text-[11px] text-slate-500">{item.description}</p>
            </div>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" />
          </button>
        ))}
        {searchResults.length === 0 && (
          <div className="px-3 py-8 text-center">
            <Search className="mx-auto h-5 w-5 text-slate-300" />
            <p className="mt-2 text-xs text-slate-500">没有匹配的工作台模块</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-white/95 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
      <button
        type="button"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
        aria-label="打开导航"
        title="打开导航"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </button>
      <button
        type="button"
        className="hidden h-9 w-9 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:grid"
        aria-label={isSidebarCollapsed ? "展开侧边栏" : "折叠侧边栏"}
        title={isSidebarCollapsed ? "展开侧边栏" : "折叠侧边栏"}
        onClick={onToggleSidebar}
      >
        {isSidebarCollapsed ? (
          <PanelLeftOpen className="h-4 w-4" />
        ) : (
          <PanelLeftClose className="h-4 w-4" />
        )}
      </button>

      <div className="hidden min-w-[122px] lg:block">
        <p className="text-[10px] text-slate-400">CURRENT VIEW</p>
        <p className="truncate text-sm font-medium text-slate-800">
          {currentItem?.label ?? "工作台"}
        </p>
      </div>

      <div className="relative mx-auto hidden w-full max-w-xl md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          aria-label="全局搜索"
          className="h-10 rounded-lg border-slate-200 bg-slate-50 pl-10 pr-10 text-slate-800 placeholder:text-slate-400 focus-visible:bg-white"
          placeholder="搜索任务、项目、内容或功能"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsSearchOpen(true);
          }}
          onFocus={() => setIsSearchOpen(true)}
        />
        {isSearchOpen && (
          <button
            type="button"
            className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-700"
            aria-label="关闭搜索"
            title="关闭搜索"
            onClick={() => {
              setIsSearchOpen(false);
              setQuery("");
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {isSearchOpen && <div className="absolute left-0 right-0 top-12">{searchPanel}</div>}
      </div>

      <button
        type="button"
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 md:hidden",
          isSearchOpen && "bg-slate-100 text-slate-900",
        )}
        aria-label="全局搜索"
        title="全局搜索"
        onClick={() => {
          setIsSearchOpen((open) => !open);
          setIsQuickOpen(false);
        }}
      >
        <Search className="h-4 w-4" />
      </button>

      <div className="hidden min-w-[112px] text-right xl:block">
        <p className="text-xs font-medium text-slate-700">
          {date.date} · {date.weekday}
        </p>
        <p className="mt-0.5 text-[10px] text-emerald-600">本地演示 · {date.time}</p>
      </div>

      <div className="relative">
        <button
          type="button"
          className="flex h-9 items-center gap-2 rounded-md bg-blue-600 px-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          aria-expanded={isQuickOpen}
          onClick={() => {
            setIsQuickOpen((open) => !open);
            setIsSearchOpen(false);
          }}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">快速新建</span>
          <ChevronDown className="hidden h-3.5 w-3.5 sm:block" />
        </button>
        {isQuickOpen && (
          <div className="absolute right-0 top-12 w-72 rounded-lg border border-border bg-white p-2 shadow-[0_18px_55px_rgba(15,23,42,0.16)]">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  className="flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left hover:bg-slate-100"
                  onClick={() => runQuickAction(action.label)}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  <span>
                    <span className="block text-sm font-medium text-slate-800">{action.label}</span>
                    <span className="mt-0.5 block text-[11px] text-slate-500">
                      {action.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <button
        type="button"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-slate-900 text-[10px] font-semibold text-white"
        aria-label="打开个人设置"
        title="个人设置"
        onClick={() => router.push("/settings")}
      >
        CDC
      </button>

      {isSearchOpen && (
        <div className="absolute left-4 right-4 top-[72px] md:hidden">
          <div className="mb-2 rounded-lg border border-border bg-white p-2 shadow-[0_18px_55px_rgba(15,23,42,0.16)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                aria-label="移动端全局搜索"
                className="h-10 rounded-lg bg-slate-50 pl-9"
                placeholder="搜索工作台"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>
          {searchPanel}
        </div>
      )}
    </header>
  );
}
