"use client";

import { signIn } from "next-auth/react";

export function LoginButton() {
  return <button type="button" className="mt-6 w-full rounded-md bg-blue-700 px-4 py-3 text-sm font-medium text-white hover:bg-blue-800"
    onClick={() => { void signIn("github", { callbackUrl: "/reflections" }); }}>使用 GitHub 登录</button>;
}
