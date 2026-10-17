"use client";

import { useEffect, useState } from "react";

export interface SiteMetadata {
  icpNumber: string | null;
  icpName: string | null;
  policeNumber: string | null;
  launchedAt: string | null;
}

export function useSiteMetadata() {
  const [metadata, setMetadata] = useState<SiteMetadata | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/public/site-metadata", { cache: "no-store", signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<SiteMetadata> : null)
      .then((data) => { if (!controller.signal.aborted) setMetadata(data); })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);
  return metadata;
}

export function SiteLegal({ className = "" }: { className?: string }) {
  const metadata = useSiteMetadata();
  if (!metadata?.icpNumber) return null;
  return <div className={className} aria-label="网站备案信息">
    {metadata.icpName && <span>{metadata.icpName} · </span>}
    <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">{metadata.icpNumber}</a>
    {metadata.policeNumber && <span> · {metadata.policeNumber}</span>}
  </div>;
}
