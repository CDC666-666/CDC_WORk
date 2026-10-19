import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { AppShell } from "@/components/layout/app-shell";
import { AcademicProvider } from "@/components/providers/academic-provider";
import { ReflectionsProvider } from "@/components/providers/reflections-provider";
import { ServerWorkspaceProvider } from "@/components/providers/server-workspace-provider";
import { BrandingProvider } from "@/components/providers/branding-provider";
import { getPrivateWorkspace } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const context = await getPrivateWorkspace();
  if (!context) return {};
  const row = await prisma.workspace.findUnique({ where: { id: context.workspaceId }, select: { workspaceName: true } });
  const name = row?.workspaceName || "CDC AI Workspace";
  return { title: { default: name, template: `%s | ${name}` } };
}

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  if (!(await getPrivateWorkspace())) redirect("/login");
  return <ServerWorkspaceProvider><BrandingProvider>
    <AcademicProvider><ReflectionsProvider><AppShell>{children}</AppShell></ReflectionsProvider></AcademicProvider>
  </BrandingProvider></ServerWorkspaceProvider>;
}
