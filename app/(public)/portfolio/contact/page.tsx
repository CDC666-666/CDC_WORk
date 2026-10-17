import type { Metadata } from "next";
import Link from "next/link";

import { ContactLinks } from "@/components/portfolio/contact-links";

export const metadata: Metadata = { title: "联系 · Caider / CDC666", robots: { index: false, follow: false } };

export default function PortfolioContact() {
  return <div className="portfolio-wrap portfolio-page portfolio-contact-page">
    <div className="portfolio-breadcrumb"><Link href="/portfolio">首页</Link><span>/</span><span>联系</span></div>
    <div className="portfolio-page-heading"><p className="portfolio-eyebrow">LET’S CONNECT</p><h1>保持联系<span>.</span></h1><p>欢迎围绕嵌入式、控制与机器人实践交流。联系方式仅展示本人明确配置的公开信息。</p></div>
    <div className="portfolio-contact-panel"><div><p className="portfolio-eyebrow">CONTACT / CDC666</p><h2>从一个具体问题开始。</h2><p>目前可通过 GitHub 主页联系或查看公开项目资料。邮箱、微信与二维码提供后会在这里显示。</p></div><ContactLinks /></div>
  </div>;
}
