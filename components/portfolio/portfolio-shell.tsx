import Link from "next/link";
import type { ReactNode } from "react";

import { publicPortfolio } from "@/data/public-portfolio";

const navigation = [
  { href: "/portfolio", label: "首页" },
  { href: "/portfolio/projects", label: "项目" },
  { href: "/portfolio/timeline", label: "成长时间线" },
  { href: "/portfolio/about", label: "关于我" },
] as const;

export function PortfolioShell({ children }: { children: ReactNode }) {
  return <div className="portfolio-site">
    <a className="portfolio-skip" href="#portfolio-main">跳到正文</a>
    <header className="portfolio-header">
      <div className="portfolio-wrap portfolio-header-inner">
        <Link className="portfolio-brand" href="/portfolio" aria-label="Caider 作品集首页">
          <span className="portfolio-brand-mark" aria-hidden="true">C<span>.</span></span>
          <span className="portfolio-brand-name">CAIDER <span>/ CDC666</span></span>
        </Link>
        <nav className="portfolio-nav" aria-label="展示站主导航">
          {navigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>
        <Link className="portfolio-private-link" href="/login">私人工作台 <span aria-hidden="true">↗</span></Link>
      </div>
    </header>
    <main id="portfolio-main">{children}</main>
    <footer className="portfolio-footer">
      <div className="portfolio-wrap portfolio-footer-inner">
        <div><strong>CAIDER / CDC666</strong><p>学习、实践、记录。作品集内容按可核对资料维护。</p></div>
        <div className="portfolio-footer-links">
          <Link href="/portfolio/about">关于我</Link>
          <a href={publicPortfolio.githubUrl} target="_blank" rel="noopener noreferrer">GitHub <span className="sr-only">（新窗口打开）</span>↗</a>
          <Link href="/login">私人工作台</Link>
        </div>
      </div>
    </footer>
  </div>;
}
