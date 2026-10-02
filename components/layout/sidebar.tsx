"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Bot,
  BrainCircuit,
  BriefcaseBusiness,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  CheckSquare2,
  FileChartColumn,
  FlaskConical,
  FolderKanban,
  GraduationCap,
  Home,
  Library,
  NotebookPen,
  PlaySquare,
  Settings,
  Sparkles,
  WalletCards,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";

import { getNavigationItemByPathname, navigationGroups, type NavigationIconKey } from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isCollapsed: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const navigationIcons: Record<NavigationIconKey, LucideIcon> = {
  home: Home,
  sparkles: Sparkles,
  checkSquare: CheckSquare2,
  graduationCap: GraduationCap,
  bookOpen: BookOpen,
  playSquare: PlaySquare,
  library: Library,
  chartNoAxesColumnIncreasing: ChartNoAxesColumnIncreasing,
  folderKanban: FolderKanban,
  bot: Bot,
  notebookPen: NotebookPen,
  flaskConical: FlaskConical,
  calendarDays: CalendarDays,
  fileChartColumn: FileChartColumn,
  briefcaseBusiness: BriefcaseBusiness,
  walletCards: WalletCards,
  workflow: Workflow,
  settings: Settings,
};

export function Sidebar({ isCollapsed, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const activeItem = getNavigationItemByPathname(pathname);

  return (
    <>
      <button
        type="button"
        aria-label="关闭导航遮罩"
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/35 transition-opacity lg:hidden",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-border bg-white transition-[width,transform] duration-200 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed && "lg:w-[76px]",
        )}
      >
        <div className="flex h-16 shrink-0 items-center border-b border-border px-4">
          <Link
            href="/"
            className="flex min-w-0 flex-1 items-center gap-3 rounded-sm"
            onClick={onClose}
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-blue-600 text-white shadow-sm">
              <BrainCircuit className="h-[18px] w-[18px]" />
            </div>
            <div className={cn("min-w-0", isCollapsed && "lg:hidden")}>
              <p className="truncate text-sm font-semibold text-slate-900">CDC AI Workspace</p>
              <p className="mt-0.5 truncate text-[10px] text-slate-500">个人学习与工程工作台</p>
            </div>
          </Link>
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            aria-label="关闭导航"
            title="关闭导航"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav aria-label="主导航" className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-5">
            {navigationGroups.map((group) => (
              <div key={group.label}>
                <p
                  className={cn(
                    "mb-1.5 px-2 text-[10px] font-medium text-slate-400",
                    isCollapsed && "lg:hidden",
                  )}
                >
                  {group.label}
                </p>
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = navigationIcons[item.icon];
                    const isActive = activeItem?.href === item.href;

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          title={isCollapsed ? item.label : undefined}
                          className={cn(
                            "group flex h-10 items-center gap-3 rounded-md border border-transparent px-3 text-sm font-medium transition-colors",
                            isActive
                              ? "border-blue-100 bg-blue-50 text-blue-700"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                            isCollapsed && "lg:justify-center lg:px-0",
                          )}
                          onClick={onClose}
                        >
                          <Icon
                            className={cn(
                              "h-4 w-4 shrink-0",
                              isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-700",
                            )}
                          />
                          <span className={cn("truncate", isCollapsed && "lg:hidden")}>
                            {item.label}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        <div className="shrink-0 border-t border-border p-3">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 rounded-md p-2 hover:bg-slate-100",
              isCollapsed && "lg:justify-center",
            )}
            title={isCollapsed ? "CDC · 大一学生" : undefined}
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-slate-900 text-[11px] font-semibold text-white">
              CDC
            </div>
            <div className={cn("min-w-0", isCollapsed && "lg:hidden")}>
              <p className="truncate text-sm font-medium text-slate-900">CDC</p>
              <p className="truncate text-[11px] text-slate-500">大一学生 · 电控负责人</p>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
