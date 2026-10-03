"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    setPending(true);
    setError("");
    try {
      const result = await signOut({ redirect: false, callbackUrl: "/login" });
      if (!result?.url) throw new Error("Sign-out response is missing a redirect URL.");
      router.replace("/login");
      router.refresh();
    } catch {
      setError("退出失败，请重试。");
      setPending(false);
    }
  }

  return <div className="relative shrink-0">
    <button type="button" aria-label="退出登录" title="退出登录" disabled={pending}
      className="grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
      onClick={() => { void logout(); }}>
      <LogOut className="h-4 w-4" />
    </button>
    {error && <p role="alert" className="absolute right-0 top-10 z-40 w-36 rounded-md border border-red-200 bg-white p-2 text-xs text-red-700 shadow-sm">{error}</p>}
  </div>;
}
