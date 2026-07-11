import {
  Archive,
  Bot,
  BrainCircuit,
  ClipboardCheck,
  FolderKanban,
  Gauge,
  Library,
  ListTodo,
  NotebookPen,
  ShieldAlert,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";

import { userProfile } from "@/data/mock-data";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavigationItem {
  label: string;
  icon: LucideIcon;
  active?: boolean;
}

const navigationItems: NavigationItem[] = [
  { label: "工作台", icon: Gauge, active: true },
  { label: "RoboMaster 项目", icon: FolderKanban },
  { label: "任务", icon: ListTodo },
  { label: "工程日志", icon: NotebookPen },
  { label: "测试记录", icon: ClipboardCheck },
  { label: "问题复盘", icon: ShieldAlert },
  { label: "知识库", icon: Library },
  { label: "技能树", icon: BrainCircuit },
  { label: "报告中心", icon: Archive },
  { label: "AI 助手", icon: Bot },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      <button
        type="button"
        aria-label="关闭导航遮罩"
        className={cn(
          "fixed inset-0 z-40 bg-black/70 transition-opacity lg:hidden",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[252px] flex-col border-r border-border bg-[#0b0e0f] transition-transform duration-200 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-sm border border-cyan-300/25 bg-cyan-300/10 text-cyan-300">
              <Wrench className="h-[18px] w-[18px]" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">RM 工程台</p>
              <p className="font-mono text-[10px] text-muted-foreground">CONTROL DESK / 00</p>
            </div>
          </div>
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-sm text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden"
            aria-label="关闭导航"
            title="关闭导航"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="font-mono">WORKSPACE STATUS</span>
            <span className="flex items-center gap-1.5 text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              本地就绪
            </span>
          </div>
        </div>

        <nav
          aria-label="主导航"
          className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4"
        >
          <p className="mb-2 px-2 font-mono text-[10px] text-muted-foreground">
            工程管理
          </p>
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;

              return (
                <li key={item.label}>
                  <button
                    type="button"
                    aria-current={item.active ? "page" : undefined}
                    aria-disabled={!item.active}
                    title={item.active ? item.label : `${item.label}（后续 Sprint 开放）`}
                    className={cn(
                      "group flex h-10 w-full items-center gap-3 rounded-sm border px-3 text-left text-sm transition-colors",
                      item.active
                        ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
                        : "border-transparent text-muted-foreground hover:border-border hover:bg-secondary/60 hover:text-foreground",
                    )}
                    onClick={item.active ? onClose : undefined}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        item.active
                          ? "text-cyan-300"
                          : "text-muted-foreground group-hover:text-foreground",
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {!item.active && (
                      <span className="font-mono text-[9px] text-muted-foreground/60">
                        01+
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="shrink-0 border-t border-border p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-amber-300/10 font-mono text-xs font-bold text-amber-300">
              {userProfile.initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {userProfile.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {userProfile.grade} · {userProfile.role}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-border/70 pt-3 font-mono text-[10px] text-muted-foreground">
            <span>SPRINT 0</span>
            <span>MOCK DATA</span>
          </div>
        </div>
      </aside>
    </>
  );
}
