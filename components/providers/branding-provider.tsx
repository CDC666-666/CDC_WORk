"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { defaultBranding, type WorkspaceBranding } from "@/types/workspace-branding";

interface BrandingContextValue {
  branding: WorkspaceBranding;
  loading: boolean;
  error: string | null;
  reload(): Promise<void>;
  save(patch: Partial<WorkspaceBranding>): Promise<void>;
}

const BrandingContext = createContext<BrandingContextValue | null>(null);

async function parseResponse(response: Response): Promise<WorkspaceBranding> {
  const body = await response.json() as WorkspaceBranding & { error?: string };
  if (!response.ok) throw new Error(body.error ?? "设置读取失败，请重试。");
  return body;
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState(defaultBranding);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setBranding(await parseResponse(await fetch("/api/private/branding", { cache: "no-store" })));
      setError(null);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "设置读取失败。");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  useEffect(() => {
    const separator = document.title.lastIndexOf(" | ");
    document.title = separator >= 0 ? `${document.title.slice(0, separator)} | ${branding.workspaceName}` : branding.workspaceName;
  }, [branding.workspaceName]);
  const save = async (patch: Partial<WorkspaceBranding>) => {
    const next = await parseResponse(await fetch("/api/private/branding", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch),
    }));
    setBranding(next);
    setError(null);
  };
  return <BrandingContext.Provider value={{ branding, loading, error, reload, save }}>
    {error && <div role="alert" className="border-b border-rose-200 bg-rose-50 px-4 py-2 text-center text-xs text-rose-700">
      个人设置读取失败：{error} <button type="button" className="ml-2 font-semibold underline" onClick={() => { void reload(); }}>重试</button>
    </div>}
    {children}
  </BrandingContext.Provider>;
}

export function useBranding(): BrandingContextValue {
  const value = useContext(BrandingContext);
  if (!value) throw new Error("BrandingProvider 未挂载。");
  return value;
}
