import type { Metadata, Viewport } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { WorkspaceDataProvider } from "@/components/providers/workspace-data-provider";
import { AcademicProvider } from "@/components/providers/academic-provider";
import { ReflectionsProvider } from "@/components/providers/reflections-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CDC AI Workspace",
    template: "%s | CDC AI Workspace",
  },
  description: "面向大学生和工程学习者的个人 AI 工作台",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f7fa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <WorkspaceDataProvider>
          <AcademicProvider><ReflectionsProvider><AppShell>{children}</AppShell></ReflectionsProvider></AcademicProvider>
        </WorkspaceDataProvider>
      </body>
    </html>
  );
}
