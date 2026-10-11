import type { Metadata } from "next";
import Link from "next/link";

import { publicMilestones } from "@/data/public-portfolio";
import type { ProjectDirection } from "@/types/public-portfolio";

export const metadata: Metadata = { title: "成长时间线 · Caider / CDC666", robots: { index: false, follow: false } };

const directions: readonly ("全部方向" | ProjectDirection)[] = ["全部方向", "机器人", "嵌入式与控制", "软件工程"];

export default async function PortfolioTimeline({ searchParams }: { searchParams: Promise<{ direction?: string }> }) {
  const params = await searchParams;
  const direction = directions.includes(params.direction as ProjectDirection) ? params.direction! : "全部方向";
  const entries = publicMilestones.filter((entry) => direction === "全部方向" || entry.direction === direction).slice().reverse();
  return <div className="portfolio-wrap portfolio-page">
    <div className="portfolio-breadcrumb"><Link href="/portfolio">首页</Link><span>/</span><span>成长时间线</span></div>
    <div className="portfolio-page-heading"><p className="portfolio-eyebrow">GROWTH LOG / 02</p><h1>成长时间线<span>.</span></h1><p>记录有日期依据的技术节点。机械臂项目尚缺可确认的时间，不会随意安放到时间线上。</p></div>
    <div className="portfolio-filter-box"><div className="portfolio-filter-row"><span>方向筛选</span><div>{directions.map((item) => <Link key={item} href={item === "全部方向" ? "/portfolio/timeline" : `/portfolio/timeline?direction=${encodeURIComponent(item)}`} aria-current={direction === item ? "page" : undefined}>{item}</Link>)}</div></div></div>
    {entries.length ? <div className="portfolio-timeline-list">{entries.map((entry) => <article key={`${entry.date}-${entry.title}`} className="portfolio-timeline-entry">
      <time dateTime={entry.date}>{entry.date}</time><div className="portfolio-timeline-node" aria-hidden="true" /><div><span className="portfolio-eyebrow">{entry.direction}</span><h2>{entry.title}</h2><p>{entry.summary}</p><div className="portfolio-tags">{entry.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><Link className="portfolio-text-link" href={`/portfolio/projects/${entry.projectSlug}`}>查看相关项目 ↗</Link></div>
    </article>)}</div> : <div className="portfolio-empty"><h2>这个方向暂时没有可核对日期的节点</h2><p>有资料后会按实际日期补充。</p><Link className="portfolio-text-link" href="/portfolio/timeline">查看全部节点 ↗</Link></div>}
  </div>;
}
