import type { Metadata } from "next";
import Link from "next/link";

import { ProjectCard } from "@/components/portfolio/project-card";
import { listPublicProjects } from "@/lib/portfolio/public-content";
import type { ProjectDirection, ProjectStatus } from "@/types/public-portfolio";

export const metadata: Metadata = { title: "项目 · Caider / CDC666", robots: { index: false, follow: false } };

const directions: readonly ("全部方向" | ProjectDirection)[] = ["全部方向", "机器人", "嵌入式与控制", "软件工程"];
const statuses: readonly ("全部状态" | ProjectStatus)[] = ["全部状态", "持续调试", "资料待补", "持续迭代"];

function filterHref(direction: string, status: string) {
  const params = new URLSearchParams();
  if (direction !== "全部方向") params.set("direction", direction);
  if (status !== "全部状态") params.set("status", status);
  return `/portfolio/projects${params.size ? `?${params}` : ""}`;
}

export default async function PortfolioProjects({ searchParams }: { searchParams: Promise<{ direction?: string; status?: string }> }) {
  const publicProjects = listPublicProjects();
  const params = await searchParams;
  const direction = directions.includes(params.direction as ProjectDirection) ? params.direction! : "全部方向";
  const status = statuses.includes(params.status as ProjectStatus) ? params.status! : "全部状态";
  const results = publicProjects.filter((project) =>
    (direction === "全部方向" || project.direction === direction) &&
    (status === "全部状态" || project.status === status));
  return <div className="portfolio-wrap portfolio-page">
    <div className="portfolio-breadcrumb"><Link href="/portfolio">首页</Link><span>/</span><span>项目</span></div>
    <div className="portfolio-page-heading"><p className="portfolio-eyebrow">PROJECT ARCHIVE / 01</p><h1>项目实践<span>.</span></h1><p>从机器人控制到个人工具建设。每个项目都标注当前状态、我的职责与仍待核实的部分。</p></div>
    <div className="portfolio-filter-box" aria-label="项目筛选">
      <div className="portfolio-filter-row"><span>技术方向</span><div>{directions.map((item) => <Link key={item} href={filterHref(item, status)} aria-current={direction === item ? "page" : undefined}>{item}</Link>)}</div></div>
      <div className="portfolio-filter-row"><span>项目状态</span><div>{statuses.map((item) => <Link key={item} href={filterHref(direction, item)} aria-current={status === item ? "page" : undefined}>{item}</Link>)}</div></div>
    </div>
    <div className="portfolio-result-head"><span>项目 / {String(results.length).padStart(2, "0")}</span><span>按当前公开资料整理</span></div>
    {results.length ? <div className="portfolio-project-grid">{results.map((project) => <ProjectCard key={project.slug} project={project} />)}</div> : <div className="portfolio-empty"><h2>没有符合筛选条件的项目</h2><p>可以调整技术方向或状态，查看当前公开的三个项目。</p><Link className="portfolio-text-link" href="/portfolio/projects">清除筛选 ↗</Link></div>}
  </div>;
}
