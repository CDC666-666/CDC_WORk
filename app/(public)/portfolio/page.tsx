import type { Metadata } from "next";
import { HeroShowcase } from "@/components/portfolio/hero-showcase";
import { getPublicPortfolio, listPublicProjects } from "@/lib/portfolio/public-content";

export const metadata: Metadata = {
  title: "Caider / CDC666 · 工程实践作品集",
  description: "Caider / CDC666 的电气工程学习与实践：嵌入式、电机控制、机器人和个人工作台。",
  robots: { index: false, follow: false },
};

export default function PortfolioHome() {
  const publicPortfolio = getPublicPortfolio();
  const publicProjects = listPublicProjects();
  return <section className="portfolio-hero portfolio-wrap">
      <div className="portfolio-hero-copyblock">
        <div className="portfolio-badge"><i aria-hidden="true"><svg viewBox="5 1 14 22"><path d="M13.9 1.6 5.5 13.6a.7.7 0 0 0 .6 1.1h4.2l-1 7.7a.7.7 0 0 0 1.25.55l8.3-12.1a.7.7 0 0 0-.6-1.1h-4.2l1-7.7a.7.7 0 0 0-1.25-.55Z" /></svg></i><b>电气工程 / 工程实践</b></div>
        <p className="portfolio-hero-kicker">CAIDER / CDC666</p>
        <h1>穷究原理，<br /><em>洞悉本质</em></h1>
        <p className="portfolio-hero-intro">{publicPortfolio.heroIntroduction}</p>
      </div>
      <HeroShowcase projects={publicProjects} />
  </section>;
}
