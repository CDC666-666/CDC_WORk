import Link from "next/link";
import { redirect } from "next/navigation";

import { getPrivateWorkspace } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

/** Isolated from the daily Workspace providers, which may write localStorage on mount. */
export default async function MigrationLayout({ children }: { children: React.ReactNode }) {
  if (!(await getPrivateWorkspace())) redirect("/login?callbackUrl=%2Fmigration");
  return <main className="min-h-screen bg-background px-4 py-5 sm:px-6 lg:py-8">
    <div className="mx-auto max-w-[1200px] space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <span className="text-sm font-semibold text-slate-900">CDC AI Workspace · 数据迁移</span>
        <Link href="/settings" prefetch={false} className="text-sm text-blue-700 hover:underline">返回工作台</Link>
      </header>
      {children}
    </div>
  </main>;
}
