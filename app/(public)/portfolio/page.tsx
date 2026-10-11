import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { ContactLinks } from "@/components/portfolio/contact-links";
import { HeroShowcase } from "@/components/portfolio/hero-showcase";
import { ProjectCard } from "@/components/portfolio/project-card";
import { StatsSummary } from "@/components/portfolio/stats-summary";
import { getPublicPortfolio, listPublicCapabilities, listPublicProjects } from "@/lib/portfolio/public-content";

export const metadata: Metadata = {
  title: "Caider / CDC666 · 工程实践作品集",
  description: "Caider / CDC666 的电气工程学习与实践：嵌入式、电机控制、机器人和个人工作台。",
  robots: { index: false, follow: false },
};

export default function PortfolioHome() {
  const publicPortfolio = getPublicPortfolio();
  const publicProjects = listPublicProjects();
  const publicCapabilities = listPublicCapabilities();
  return <>
    <section className="portfolio-hero portfolio-wrap">
      <div className="portfolio-hero-copyblock">
        <div className="portfolio-badge"><i aria-hidden="true"><svg viewBox="5 1 14 22"><path d="M13.9 1.6 5.5 13.6a.7.7 0 0 0 .6 1.1h4.2l-1 7.7a.7.7 0 0 0 1.25.55l8.3-12.1a.7.7 0 0 0-.6-1.1h-4.2l1-7.7a.7.7 0 0 0-1.25-.55Z" /></svg></i><b>电气工程 / 工程实践</b></div>
        <p className="portfolio-hero-kicker">CAIDER / CDC666</p>
        <h1>从工程问题出发，<br /><em>让实践留下证据。</em></h1>
        <p className="portfolio-hero-intro">{publicPortfolio.introduction}</p>
        <div className="portfolio-hero-actions"><Link className="portfolio-glow-button portfolio-hero-cta" href="/portfolio/projects"><span>查看项目 <ArrowUpRight size={17} aria-hidden="true" /></span></Link><Link className="portfolio-quiet-link" href="/portfolio/about">了解我 <ArrowRight size={17} aria-hidden="true" /></Link></div>
        <ContactLinks compact />
      </div>
      <HeroShowcase />
      <a href="#selected-projects" className="portfolio-scroll-cue">向下探索 <span aria-hidden="true">↓</span></a>
    </section>

    <section id="selected-projects" className="portfolio-section portfolio-wrap">
      <div className="portfolio-section-head"><div><p className="portfolio-eyebrow">SELECTED PROJECTS / 01</p><h2>三个项目，三种实践现场。</h2><p>项目的事实范围、我的职责与未核实之处都在详情中说明。</p></div><Link className="portfolio-text-link" href="/portfolio/projects">全部项目 ↗</Link></div>
      <div className="portfolio-project-grid">{publicProjects.map((project) => <ProjectCard key={project.slug} project={project} />)}</div>
    </section>

    <section className="portfolio-capability-band"><div className="portfolio-wrap"><div className="portfolio-section-head"><div><p className="portfolio-eyebrow">PRACTICE / 02</p><h2>学习背景与实践方向</h2><p>以电气工程为学习背景，沿着嵌入式、控制、机器人与软件工具持续实践。</p></div></div><div className="portfolio-capability-grid">{publicCapabilities.map((item) => <article className="portfolio-capability" key={item.title}><span>{item.level}</span><h3>{item.title}</h3><p>{item.description}</p><div>{item.projectSlugs.map((slug) => { const project = publicProjects.find((entry) => entry.slug === slug); return project && <Link href={`/portfolio/projects/${slug}`} key={slug}>{project.title} ↗</Link>; })}</div></article>)}</div></div></section>

    <section className="portfolio-contact-section portfolio-wrap" id="contact"><div><p className="portfolio-eyebrow">CONTACT / 03</p><h2>一起交流工程实践。</h2><p>目前可通过 GitHub 找到我。邮箱和微信在得到可公开的信息后显示。</p></div><ContactLinks /></section>
    <StatsSummary />
  </>;
}
