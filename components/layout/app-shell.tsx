"use client";

import { useCallback, useState } from "react";

import {
  ActionToast,
  type ToastNotice,
} from "@/components/layout/action-toast";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [notice, setNotice] = useState<ToastNotice | null>(null);

  const dismissNotice = useCallback(() => setNotice(null), []);

  const showNotice = useCallback((title: string, description: string) => {
    setNotice({ id: Date.now(), title, description });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />
      <div
        className={cn(
          "min-w-0 transition-[padding] duration-200",
          isSidebarCollapsed ? "lg:pl-[76px]" : "lg:pl-[260px]",
        )}
      >
        <Topbar
          isSidebarCollapsed={isSidebarCollapsed}
          onMenuClick={() => setIsMobileSidebarOpen(true)}
          onNotify={showNotice}
          onToggleSidebar={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
        />
        <main className="workspace-grid min-h-[calc(100vh-64px)]">
          <div className="mx-auto w-full max-w-[1680px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
            {children}
          </div>
        </main>
      </div>
      <ActionToast notice={notice} onDismiss={dismissNotice} />
    </div>
  );
}
