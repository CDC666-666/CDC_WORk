import type { Metadata } from "next";

import { LoginButton } from "@/components/auth/login-button";

export const metadata: Metadata = { title: "登录私人工作台" };

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const callbackUrl = (await searchParams).callbackUrl === "/migration" ? "/migration" : "/reflections";
  const configured = Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET &&
    process.env.NEXTAUTH_SECRET && process.env.ALLOWED_GITHUB_USER_ID);
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
    <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
      <p className="text-xs font-semibold tracking-widest text-blue-700">CDC AI WORKSPACE</p>
      <h1 className="mt-3 text-2xl font-semibold text-slate-900">登录私人工作台</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">仅允许预先配置的 GitHub 账号访问。</p>
      {configured ? <LoginButton callbackUrl={callbackUrl} /> : <p role="status" className="mt-6 rounded-md bg-amber-50 p-3 text-sm text-amber-800">服务器尚未配置 GitHub OAuth，私人工作台暂不可登录。</p>}
    </section>
  </main>;
}
