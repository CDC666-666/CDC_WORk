"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { sourceCategory } from "@/lib/portfolio/analytics-policy";

export function PortfolioTracker() {
  const pathname = usePathname();
  const reported = useRef<string | null>(null);
  useEffect(() => {
    // Effects run only after an actual navigation; Link prefetch never counts.
    if (!pathname || reported.current === pathname) return;
    const previous = reported.current;
    reported.current = pathname;
    void fetch("/api/public/portfolio-visit", {
      method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: crypto.randomUUID(), path: pathname, source: sourceCategory(previous ? `${window.location.origin}${previous}` : document.referrer, window.location.origin) }),
    }).then((response) => { if (response.ok) window.dispatchEvent(new Event("portfolio-visit-recorded")); }).catch(() => undefined);
  }, [pathname]);
  return null;
}
