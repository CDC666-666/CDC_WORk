"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { publicPortfolio } from "@/data/public-portfolio";
import type { PortfolioAnalyticsResponse } from "@/types/portfolio-analytics";

function useSummary() {
  const [data, setData] = useState<PortfolioAnalyticsResponse | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const load = () => { fetch("/api/public/portfolio-stats?days=7", { cache: "no-store", signal: controller.signal }).then((response) => response.json()).then((result: PortfolioAnalyticsResponse) => setData(result)).catch(() => { if (!controller.signal.aborted) setData({ status: "error", message: "统计服务暂时不可用" }); }); };
    load();
    window.addEventListener("portfolio-visit-recorded", load);
    return () => { controller.abort(); window.removeEventListener("portfolio-visit-recorded", load); };
  }, []);
  return data;
}

export function Uptime({ inline = false }: { inline?: boolean }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!publicPortfolio.launchedAt) return;
    function update() { if (!document.hidden) setNow(Date.now()); }
    update();
    const timer = window.setInterval(update, 1000);
    document.addEventListener("visibilitychange", update);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", update); };
  }, []);
  if (!publicPortfolio.launchedAt) return <>尚未正式上线</>;
  const start = Date.parse(publicPortfolio.launchedAt);
  if (!Number.isFinite(start) || now === null || now < start) return <>尚未正式上线</>;
  const seconds = Math.floor((now - start) / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor(seconds % 86400 / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  return <>{days}天 {hours}时 {minutes}分{inline ? "" : ` ${seconds % 60}秒`}</>;
}

export function StatsSummary() {
  const data = useSummary();
  return <section className="portfolio-stats-summary"><div className="portfolio-wrap portfolio-stats-summary-inner"><div><p className="portfolio-eyebrow">SITE TELEMETRY / 04</p><h2>站点运行记录</h2><Link className="portfolio-text-link" href="/portfolio/stats">查看完整统计 ↗</Link></div><div className="portfolio-stats-summary-data">{data?.status === "ok" ? <><div><span>累计访客</span><strong>{data.totals.visitors.toLocaleString()}</strong></div><div><span>累计浏览量</span><strong>{data.totals.views.toLocaleString()}</strong></div></> : <div><span>访问数据</span><strong className="portfolio-stats-state">{data ? data.message : "读取中…"}</strong></div>}<div><span>运行时长</span><strong className="portfolio-stats-state"><Uptime inline /></strong></div></div></div></section>;
}

export function StatsSummaryInline() {
  const data = useSummary();
  return <span>累计访客 {data?.status === "ok" ? data.totals.visitors : "—"} · 累计浏览量 {data?.status === "ok" ? data.totals.views : "—"} · 运行时长 <Uptime inline /> · <Link href="/portfolio/stats">完整统计 ↗</Link></span>;
}
