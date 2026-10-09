import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { AcademicProvider } from "@/components/providers/academic-provider";
import { ReflectionsProvider } from "@/components/providers/reflections-provider";
import { ServerWorkspaceProvider } from "@/components/providers/server-workspace-provider";
import { getPrivateWorkspace } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  if (!(await getPrivateWorkspace())) redirect("/login");
  return <ServerWorkspaceProvider>
    <AcademicProvider><ReflectionsProvider><AppShell>{children}</AppShell></ReflectionsProvider></AcademicProvider>
  </ServerWorkspaceProvider>;
}
