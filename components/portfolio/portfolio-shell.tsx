"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Github, Menu, X } from "lucide-react";

import { PortfolioTracker } from "@/components/portfolio/portfolio-tracker";
import { StatsSummaryInline } from "@/components/portfolio/stats-summary";
import { SiteLegal } from "@/components/site-legal";
import { publicContact } from "@/data/public-contact";

const navigation = [
  { href: "/portfolio", label: "首页" },
  { href: "/portfolio/projects", label: "项目" },
  { href: "/portfolio/about", label: "关于我" },
  { href: "/portfolio/stats", label: "站点统计" },
  { href: "/portfolio/contact", label: "联系" },
] as const;

// The public portfolio and private Workspace have different local origins during preview.
// On a single-origin deployment the relative fallback keeps the existing login route.
const privateWorkspaceHref = process.env.NEXT_PUBLIC_PRIVATE_WORKSPACE_URL || "/login";

export function PortfolioShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); toggleRef.current?.focus(); } };
    const outside = (event: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("keydown", close);
    document.addEventListener("mousedown", outside);
    return () => { document.removeEventListener("keydown", close); document.removeEventListener("mousedown", outside); };
  }, [open]);

  return <div className="portfolio-site">
    <PortfolioTracker />
    <a className="portfolio-skip" href="#portfolio-main">跳到正文</a>
    <div className="portfolio-stars" aria-hidden="true" />
    <header className="portfolio-header"><div className="portfolio-nav-shell" ref={menuRef}>
      <Link className="portfolio-brand" href="/portfolio" aria-label="Caider 作品集首页"><span className="portfolio-brand-orbit" aria-hidden="true">✦</span><span><small>ENGINEERING / PORTFOLIO</small><strong>CAIDER</strong></span></Link>
      <button ref={toggleRef} className="portfolio-menu-toggle" type="button" aria-label={open ? "关闭菜单" : "打开菜单"} aria-controls="portfolio-nav-panel" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      <div className={`portfolio-nav-panel${open ? " is-open" : ""}`} id="portfolio-nav-panel"><nav aria-label="展示站主导航">{navigation.map((item) => <Link key={item.href} href={item.href} aria-current={path === item.href ? "page" : undefined}>{item.label}</Link>)}</nav><a className="portfolio-glow-button portfolio-nav-cta" href={privateWorkspaceHref}><span>私人工作台 ↗</span></a></div>
    </div></header>
    <main id="portfolio-main">{children}</main>
    {path === "/portfolio" ? <SiteLegal className="portfolio-home-legal" /> : <footer className="portfolio-footer"><div className="portfolio-wrap portfolio-footer-inner"><div><strong>CAIDER / CDC666</strong><p>学习、实践、记录。项目内容仅按可核对资料维护。</p></div><div className="portfolio-footer-links"><Link href="/portfolio/projects">项目</Link><Link href="/portfolio/stats">站点统计</Link><Link href="/portfolio/contact">联系</Link><a href={publicContact.githubUrl} target="_blank" rel="noopener noreferrer" aria-label="GitHub 主页"><Github size={17} /></a></div></div><div className="portfolio-wrap portfolio-footer-stats"><StatsSummaryInline /></div><SiteLegal className="portfolio-wrap portfolio-footer-stats" /></footer>}
  </div>;
}
