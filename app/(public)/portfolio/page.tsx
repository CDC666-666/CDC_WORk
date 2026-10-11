import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Github, MoveRight } from "lucide-react";

import { ContributionGraph } from "@/components/portfolio/contribution-graph";
import { ProjectCard } from "@/components/portfolio/project-card";
import { publicCapabilities, publicMilestones, publicPortfolio, publicProjects } from "@/data/public-portfolio";
import { getContributionCalendar } from "@/lib/portfolio/github-contributions";

export const metadata: Metadata = {
  title: "Caider / CDC666 · 工程实践与成长",
  description: "Caider / CDC666 的学习与工程实践：嵌入式、电机控制、机器人和个人工作台。",
  robots: { index: false, follow: false },
};

// Render each request so an optional server-only GitHub credential can be added
// without rebuilding. The GraphQL response itself is cached for one hour.
export const dynamic = "force-dynamic";

export default async function PortfolioHome() {
  const calendar = await getContributionCalendar();
  return <>
    <section className="portfolio-hero portfolio-wrap">
      <div className="portfolio-hero-main">
        <p className="portfolio-eyebrow"><span className="portfolio-blue-dot" /> ELECTRICAL ENGINEERING / PRACTICE</p>
        <h1>把问题拆开，<br /><em>把实践做实。</em></h1>
        <p className="portfolio-hero-copy">我是 <strong>Caider / CDC666</strong>。{publicPortfolio.introduction}</p>
        <div className="portfolio-hero-actions">
          <Link className="portfolio-button-primary" href="/portfolio/projects">查看项目 <ArrowUpRight size={17} aria-hidden="true" /></Link>
          <Link className="portfolio-button-outline" href="/portfolio/timeline">成长时间线 <MoveRight size={17} aria-hidden="true" /></Link>
          <a className="portfolio-button-quiet" href={publicPortfolio.githubUrl} target="_blank" rel="noopener noreferrer"><Github size={17} aria-hidden="true" /> GitHub <span className="sr-only">（新窗口打开）</span></a>
        </div>
      </div>
      <div className="portfolio-hero-aside" aria-label="当前关注方向">
        <div className="portfolio-aside-top"><span>NOW / FOCUS</span><span>01 — 03</span></div>
        <div className="portfolio-orbit" aria-hidden="true"><span /><span /><span /></div>
        <h2>当前关注</h2>
        <p>{publicPortfolio.currentFocus}</p>
        <div className="portfolio-aside-bottom"><span>持续学习 / 持续验证</span><time dateTime={publicPortfolio.updatedAt}>更新 {publicPortfolio.updatedAt}</time></div>
      </div>
      <a className="portfolio-scroll-cue" href="#selected-projects">向下探索 <ArrowDownRight size={17} aria-hidden="true" /></a>
    </section>

    <section id="selected-projects" className="portfolio-section portfolio-wrap">
      <div className="portfolio-section-head"><div><p className="portfolio-eyebrow">SELECTED WORK / 01</p><h2>从代码到现场的项目实践</h2><p>只展示已有资料可以支撑的范围；待补的结果会明确标出。</p></div><Link className="portfolio-text-link" href="/portfolio/projects">全部项目 <ArrowUpRight size={17} aria-hidden="true" /></Link></div>
      <div className="portfolio-project-grid">{publicProjects.map((project) => <ProjectCard key={project.slug} project={project} />)}</div>
    </section>

    <section className="portfolio-capability-band"><div className="portfolio-wrap">
      <div className="portfolio-section-head"><div><p className="portfolio-eyebrow">CAPABILITIES / 02</p><h2>技术方向与项目依据</h2><p>用实际项目与资料状态描述能力，不用百分比代替证据。</p></div></div>
      <div className="portfolio-capability-grid">{publicCapabilities.map((item, index) => <article className="portfolio-capability" key={item.title}>
        <div className="portfolio-capability-top"><span>0{index + 1}</span><span className="portfolio-status">{item.level}</span></div>
        <h3>{item.title}</h3><p>{item.description}</p>
        <div className="portfolio-capability-evidence">{item.projectSlugs.length ? item.projectSlugs.map((slug) => { const project = publicProjects.find((entry) => entry.slug === slug); return project ? <Link href={`/portfolio/projects/${slug}`} key={slug}>{project.title} ↗</Link> : null; }) : <span>暂无公开项目依据</span>}</div>
      </article>)}</div>
    </div></section>

    <section className="portfolio-section portfolio-wrap portfolio-growth-section">
      <div className="portfolio-section-head"><div><p className="portfolio-eyebrow">GROWTH LOG / 03</p><h2>最近的成长节点</h2><p>以有日期的项目记录为准，持续补充更完整的过程。</p></div><Link className="portfolio-text-link" href="/portfolio/timeline">完整时间线 <ArrowUpRight size={17} aria-hidden="true" /></Link></div>
      <div className="portfolio-growth-list">{publicMilestones.slice().reverse().map((milestone) => <article className="portfolio-growth-item" key={milestone.date + milestone.title}>
        <time dateTime={milestone.date}>{milestone.date}</time><div><h3>{milestone.title}</h3><p>{milestone.summary}</p></div><Link href={`/portfolio/projects/${milestone.projectSlug}`} aria-label={`查看${milestone.title}的相关项目`}><ArrowUpRight size={20} aria-hidden="true" /></Link>
      </article>)}</div>
    </section>

    <div className="portfolio-wrap portfolio-contribution-wrap"><ContributionGraph calendar={calendar} /></div>

    <section className="portfolio-closing"><div className="portfolio-wrap portfolio-closing-inner"><div><p className="portfolio-eyebrow">KEEP BUILDING</p><h2>记录过程，继续向前。</h2><p>目前的重点是把学习与实践中的问题说明白，再用可核对的结果逐步完善作品。</p></div><Link href="/portfolio/about" className="portfolio-button-primary">了解更多 <ArrowUpRight size={17} aria-hidden="true" /></Link></div></section>
  </>;
}
