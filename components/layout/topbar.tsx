"use client";
/* eslint-disable @next/next/no-img-element -- cropped avatar is a private data URL */

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Bug,
  ChevronDown,
  FilePlus2,
  FlaskConical,
  FolderPlus,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  X,
} from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { Input } from "@/components/ui/input";
import { useWorkspaceData } from "@/hooks/use-workspace-data";
import { useBranding } from "@/components/providers/branding-provider";
import { getNavigationItemByPathname } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import type { SearchResult } from "@/services/server/global-search";

interface TopbarProps {
  isSidebarCollapsed: boolean;
  onMenuClick: () => void;
  onToggleSidebar: () => void;
}

const quickActions = [
  { label: "新建项目", description: "建立项目主线", icon: FolderPlus, href: "/projects?create=1" },
  { label: "研发过程记录", description: "记录研发过程", icon: FilePlus2, href: "/experiences?create=log" },
  { label: "工程经验", description: "沉淀调试结论", icon: BookOpen, href: "/experiences" },
  { label: "测试记录", description: "记录测试数据", icon: FlaskConical, href: "/reviews?create=test" },
  { label: "技术问题", description: "进入问题闭环", icon: Bug, href: "/reviews?create=issue" },
  { label: "知识条目", description: "沉淀可复用知识", icon: BookOpen, href: "/knowledge" },
  { label: "收支记录", description: "记录个人收支", icon: Plus, href: "/finance" },
];

function highlight(value: string, query: string) {
  const terms = query.trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return value;
  const expression = new RegExp(`(${terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "ig");
  return value.split(expression).map((part, index) => terms.some((term) => part.toLocaleLowerCase("zh-CN") === term.toLocaleLowerCase("zh-CN"))
    ? <mark key={index} className="rounded bg-amber-100 text-inherit">{part}</mark> : <span key={index}>{part}</span>);
}

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
  onToggleSidebar,
}: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data, domainRevision } = useWorkspaceData();
  const { branding } = useBranding();
  const quickRef = useRef<HTMLDivElement>(null);
  const quickButtonRef = useRef<HTMLButtonElement>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [query, setQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickOpen, setIsQuickOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const requestId = useRef(0);

  useEffect(() => {
    const updateClock = () => setNow(new Date());
    updateClock();
    const timer = window.setInterval(updateClock, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => { setIsQuickOpen(false); setIsSearchOpen(false); }, [pathname]);
  useEffect(() => {
    if (!isQuickOpen) return;
    const outside = (event: PointerEvent) => { if (!quickRef.current?.contains(event.target as Node)) setIsQuickOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setIsQuickOpen(false); quickButtonRef.current?.focus(); } };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [isQuickOpen]);
  useEffect(() => {
    const current = ++requestId.current;
    if (!isSearchOpen || !query.trim()) { setSearchResults([]); setSearchLoading(false); setSearchError(""); return; }
    const controller = new AbortController();
    setSearchLoading(true); setSearchError(""); setSearchResults([]); setActiveIndex(0);
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: query.trim() });
        if (typeFilter) params.set("type", typeFilter);
        if (projectFilter) params.set("projectId", projectFilter);
        if (tagFilter) params.set("tag", tagFilter);
        const response = await fetch(`/api/private/search?${params}`, { cache: "no-store", signal: controller.signal });
        const body = await response.json() as { results?: SearchResult[]; error?: string };
        if (!response.ok) throw new Error(body.error ?? "搜索失败。");
        if (current === requestId.current) setSearchResults(body.results ?? []);
      } catch (cause: unknown) {
        if (!controller.signal.aborted && current === requestId.current) setSearchError(cause instanceof Error ? cause.message : "搜索失败，请重试。");
      } finally { if (current === requestId.current) setSearchLoading(false); }
    }, 280);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [isSearchOpen, query, typeFilter, projectFilter, tagFilter, domainRevision]);

  const date = formatDate(now);
  const currentItem = getNavigationItemByPathname(pathname);
  const closeSearch = () => { setIsSearchOpen(false); setQuery(""); };
  const searchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") { event.preventDefault(); closeSearch(); }
    if (event.key === "ArrowDown" && searchResults.length) { event.preventDefault(); setActiveIndex((index) => (index + 1) % searchResults.length); }
    if (event.key === "ArrowUp" && searchResults.length) { event.preventDefault(); setActiveIndex((index) => (index - 1 + searchResults.length) % searchResults.length); }
    if (event.key === "Enter" && searchResults[activeIndex]) { event.preventDefault(); navigateTo(searchResults[activeIndex].href); }
  };

  const navigateTo = (href: string) => {
    closeSearch();
    router.push(href);
  };

  const runQuickAction = (href: string) => {
    setIsQuickOpen(false);
    router.push(href);
  };

  const searchPanel = (
    <div className="rounded-lg border border-border bg-white p-2 shadow-[0_18px_55px_rgba(15,23,42,0.16)]">
      <div className="grid gap-2 border-b p-2 sm:grid-cols-3">
        <select aria-label="搜索内容类型" className="rounded border p-2 text-xs" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          <option value="">全部类型</option>{["项目", "任务", "课程", "课程记录", "作业", "总结", "工程经验", "技术问题", "测试记录", "知识库", "阅读", "账单", "视频内容", "技术内容", "日历事项"].map((type) => <option key={type}>{type}</option>)}
        </select>
        <select aria-label="搜索关联项目" className="rounded border p-2 text-xs" value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)}>
          <option value="">全部项目</option>{data.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select>
        <Input aria-label="搜索标签筛选" className="h-8 text-xs" placeholder="筛选标签" value={tagFilter} onChange={(event) => setTagFilter(event.target.value)} />
      </div>
      <div className="max-h-80 overflow-y-auto">
        {searchResults.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={cn("group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left hover:bg-slate-100", index === activeIndex && "bg-blue-50")}
            onMouseEnter={() => setActiveIndex(index)}
            onClick={() => navigateTo(item.href)}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-800"><span className="mr-2 text-[10px] text-blue-600">{item.type}</span>{highlight(item.title, query)}</p>
              <p className="mt-0.5 truncate text-[11px] text-slate-500">{highlight(item.summary, query)}</p>
              {item.source && <p className="text-[10px] text-slate-400">{item.source}</p>}
            </div>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" />
          </button>
        ))}
        {searchLoading && <p role="status" className="px-3 py-6 text-center text-xs text-slate-500">正在搜索…</p>}
        {searchError && <p role="alert" className="px-3 py-6 text-center text-xs text-rose-700">{searchError}</p>}
        {!searchLoading && !searchError && searchResults.length === 0 && (
          <div className="px-3 py-8 text-center">
            <Search className="mx-auto h-5 w-5 text-slate-300" />
            <p className="mt-2 text-xs text-slate-500">{query.trim() ? "没有匹配的记录" : "输入关键词搜索私人记录"}</p>
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
          onKeyDown={searchKeyDown}
        />
        {isSearchOpen && (
          <button
            type="button"
            className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-700"
            aria-label="关闭搜索"
            title="关闭搜索"
            onClick={closeSearch}
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
        <p className="mt-0.5 text-[10px] text-emerald-600">{date.time}</p>
      </div>

      <div className="relative" ref={quickRef}>
        <button
          type="button"
          ref={quickButtonRef}
          aria-label="快速新建"
          aria-haspopup="menu"
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
          <div role="menu" className="absolute right-0 top-12 w-72 rounded-lg border border-border bg-white p-2 shadow-[0_18px_55px_rgba(15,23,42,0.16)]">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  role="menuitem"
                  className="flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left hover:bg-slate-100"
                  onClick={() => runQuickAction(action.href)}
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
        {branding.avatar ? <img src={branding.avatar} alt="" className="h-full w-full rounded-md object-cover" /> : branding.displayName.slice(0, 2)}
      </button>
      <LogoutButton />

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
                onKeyDown={searchKeyDown}
              />
            </div>
          </div>
          {searchPanel}
        </div>
      )}
    </header>
  );
}
