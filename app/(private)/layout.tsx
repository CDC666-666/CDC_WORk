import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { AcademicProvider } from "@/components/providers/academic-provider";
import { ReflectionsProvider } from "@/components/providers/reflections-provider";
import { WorkspaceDataProvider } from "@/components/providers/workspace-data-provider";
import { getPrivateWorkspace } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  if (!(await getPrivateWorkspace())) redirect("/login");
  return <WorkspaceDataProvider>
    <AcademicProvider><ReflectionsProvider><AppShell>{children}</AppShell></ReflectionsProvider></AcademicProvider>
  </WorkspaceDataProvider>;
}
