import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

import { ProjectVisual } from "@/components/portfolio/project-visual";
import { getPublicProject, publicProjects } from "@/data/public-portfolio";

export function generateStaticParams() {
  return publicProjects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const project = getPublicProject((await params).slug);
  if (!project) return { title: "项目未找到", robots: { index: false, follow: false } };
  return { title: `${project.title} · Caider / CDC666`, description: project.summary, robots: { index: false, follow: false } };
}

export default async function PortfolioProjectDetail({ params }: { params: Promise<{ slug: string }> }) {
  const project = getPublicProject((await params).slug);
  if (!project) notFound();
  return <div className="portfolio-wrap portfolio-page portfolio-detail">
    <div className="portfolio-breadcrumb"><Link href="/portfolio">首页</Link><span>/</span><Link href="/portfolio/projects">项目</Link><span>/</span><span>{project.title}</span></div>
    <Link className="portfolio-back" href="/portfolio/projects"><ArrowLeft size={17} aria-hidden="true" /> 返回项目列表</Link>
    <header className="portfolio-detail-heading"><div><p className="portfolio-eyebrow">PROJECT / {project.number} · {project.direction}</p><h1>{project.title}</h1><p>{project.summary}</p><div className="portfolio-tags">{project.technologies.map((tag) => <span key={tag}>{tag}</span>)}</div></div><span className="portfolio-status">{project.status}</span></header>
    <div className="portfolio-detail-visual"><ProjectVisual kind={project.visual} /></div>
    <div className="portfolio-detail-grid"><aside><p className="portfolio-eyebrow">PROJECT NOTES</p><div><span>项目状态</span><strong>{project.status}</strong></div><div><span>技术方向</span><strong>{project.direction}</strong></div><div><span>我的职责</span><strong>{project.role}</strong></div>{project.repositoryUrl ? <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer">查看 GitHub 资料 <span className="sr-only">（新窗口打开）</span><ArrowUpRight size={16} aria-hidden="true" /></a> : <p className="portfolio-repo-pending">尚无核对过的公开仓库链接</p>}</aside>
      <div className="portfolio-detail-sections">
        <section><span>01 / GOAL</span><h2>项目目标</h2><p>{project.goal}</p></section>
        <section><span>02 / ROLE</span><h2>我的职责</h2><p>{project.role}</p></section>
        <section><span>03 / APPROACH</span><h2>关键方案</h2><ul>{project.approach.map((item) => <li key={item}>{item}</li>)}</ul></section>
        <section><span>04 / PROBLEM</span><h2>代表性问题与解决过程</h2><p>{project.challenge}</p></section>
        <section><span>05 / RESULT</span><h2>当前成果</h2><p>{project.outcome}</p></section>
        <section><span>06 / NEXT</span><h2>后续计划</h2><p>{project.next}</p></section>
      </div>
    </div>
    <div className="portfolio-next-project"><p>继续浏览</p><Link href={`/portfolio/projects/${publicProjects[(publicProjects.findIndex((item) => item.slug === project.slug) + 1) % publicProjects.length].slug}`}>下一个项目 <ArrowUpRight size={18} aria-hidden="true" /></Link></div>
  </div>;
}
