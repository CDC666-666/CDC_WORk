import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Github } from "lucide-react";

import { publicPortfolio } from "@/data/public-portfolio";

export const metadata: Metadata = { title: "关于我 · Caider / CDC666", robots: { index: false, follow: false } };

export default function PortfolioAbout() {
  return <div className="portfolio-wrap portfolio-page portfolio-about">
    <div className="portfolio-breadcrumb"><Link href="/portfolio">首页</Link><span>/</span><span>关于我</span></div>
    <div className="portfolio-page-heading"><p className="portfolio-eyebrow">ABOUT / 03</p><h1>关于我<span>.</span></h1><p>Caider / CDC666 · 电气工程学习者</p></div>
    <div className="portfolio-about-grid"><div className="portfolio-about-statement"><span className="portfolio-quote-mark">“</span><h2>学习不止于理解原理，<br />也要经得起实际问题的追问。</h2><p>{publicPortfolio.introduction}</p></div><div className="portfolio-about-aside"><p className="portfolio-eyebrow">CURRENTLY</p><h3>现在正在做</h3><p>{publicPortfolio.currentFocus}</p><time dateTime={publicPortfolio.updatedAt}>最近更新 · {publicPortfolio.updatedAt}</time></div></div>
    <div className="portfolio-about-columns"><section><p className="portfolio-eyebrow">BACKGROUND</p><h2>学习背景</h2><p>以电气工程为学习背景，逐步把嵌入式系统、控制与机器人实践联系起来。具体学历、学校与时间尚未提供，因此此处不作推断。</p></section><section><p className="portfolio-eyebrow">INTERESTS</p><h2>关注方向</h2><p>嵌入式与电机控制、机器人系统联调，以及让工程记录能够被回看和复用的软件工具。</p></section><section><p className="portfolio-eyebrow">PROCESS</p><h2>工作方式</h2><p>把源码、运行版本和现场观察分开记录；先定位问题出现在哪个环节，再整理有适用边界的结论。</p></section></div>
    <div className="portfolio-about-contact"><div><p className="portfolio-eyebrow">LINKS</p><h2>继续了解</h2><p>项目介绍留在本站，工程文件与公开仓库资料通过 GitHub 查看。</p></div><div><a className="portfolio-button-primary" href={publicPortfolio.githubUrl} target="_blank" rel="noopener noreferrer"><Github size={17} aria-hidden="true" /> GitHub 主页 <span className="sr-only">（新窗口打开）</span><ArrowUpRight size={17} aria-hidden="true" /></a><Link className="portfolio-button-outline" href="/portfolio/projects">浏览项目 <ArrowUpRight size={17} aria-hidden="true" /></Link></div></div>
  </div>;
}
