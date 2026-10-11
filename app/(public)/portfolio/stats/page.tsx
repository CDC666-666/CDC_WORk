import type { Metadata } from "next";
import Link from "next/link";

import { ContributionGraph } from "@/components/portfolio/contribution-graph";
import { StatsDashboard } from "@/components/portfolio/stats-dashboard";
import { getContributionCalendar } from "@/lib/portfolio/github-contributions";

export const metadata: Metadata = { title: "站点统计 · Caider / CDC666", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PortfolioStats() {
  const calendar = await getContributionCalendar();
  return <div className="portfolio-wrap portfolio-page portfolio-stats-page"><div className="portfolio-breadcrumb"><Link href="/portfolio">首页</Link><span>/</span><span>站点统计</span></div><div className="portfolio-page-heading"><p className="portfolio-eyebrow">PUBLIC TELEMETRY</p><h1>站点统计<span>.</span></h1><p>这里展示公开作品集的匿名访问聚合；下方 GitHub 贡献来自 GitHub 官方接口，与本站访问数据互不相加。</p></div><StatsDashboard /><div className="portfolio-stats-github"><ContributionGraph calendar={calendar} /></div></div>;
}
