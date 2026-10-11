"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

import { ProjectVisual } from "@/components/portfolio/project-visual";
import { publicProjects } from "@/data/public-portfolio";

const cardCount = 21;
const radius = 670;
const step = 360 / cardCount;

export function HeroShowcase() {
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cards = Array.from(ring.current?.children ?? []) as HTMLElement[];
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let phase = 0;
    let last = 0;
    function place() {
      cards.forEach((card, index) => {
        // Camera at the ring centre: tangent cards recede with angle and face inward.
        const angle = ((index * step + phase + 540) % 360) - 180;
        const radians = angle * Math.PI / 180;
        card.style.visibility = Math.abs(angle) > 52 ? "hidden" : "visible";
        card.style.transform = `translate3d(${radius * Math.sin(radians)}px, 0, ${radius * (1 - Math.cos(radians))}px) rotateY(${-angle}deg)`;
        card.style.filter = `brightness(${Math.max(.55, 1 - Math.abs(angle) / 115)})`;
      });
    }
    function tick(now: number) {
      if (document.hidden || motion.matches) { frame = 0; return; }
      if (last) phase -= 1.5 * Math.min((now - last) / 1000, .1);
      place();
      last = now;
      frame = requestAnimationFrame(tick);
    }
    place();
    if (!motion.matches && !document.hidden) frame = requestAnimationFrame(tick);
    const visibility = () => { last = 0; if (!document.hidden && !motion.matches && !frame) frame = requestAnimationFrame(tick); };
    const motionChange = () => { place(); visibility(); };
    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", motionChange);
    return () => { cancelAnimationFrame(frame); document.removeEventListener("visibilitychange", visibility); motion.removeEventListener("change", motionChange); };
  }, []);

  return <div className="portfolio-showcase" aria-label="三个真实项目的循环工程图封面，前方为个人工作台界面结构示意">
    <div className="portfolio-ring" ref={ring} aria-hidden="true">{Array.from({ length: cardCount }, (_, index) => {
      const project = publicProjects[index % publicProjects.length];
      return <div className="portfolio-ring-card" key={index}><ProjectVisual kind={project.visual} /><span>{project.title}</span></div>;
    })}</div>
    <div className="portfolio-browser-mock">
      <div className="portfolio-browser-top"><div className="portfolio-browser-dots"><i /><i /><i /></div><span>个人工作台 / 工程经验</span><small>UI STRUCTURE</small></div>
      <div className="portfolio-browser-surface"><div className="portfolio-mock-sidebar"><strong>CDC / WORK</strong><span>工作区</span><span>项目</span><span className="active">工程经验</span><span>知识</span></div><div className="portfolio-mock-content"><p className="portfolio-eyebrow">PRIVATE WORKSPACE</p><h3>把工程问题，整理成可复用经验。</h3><p>来源 · 证据 · 适用边界</p><div className="portfolio-mock-cards"><div><b>调试过程</b><i /><i /><i /></div><div><b>验证状态</b><i /><i /></div><div><b>项目关联</b><i /><i /></div></div><Link href="/portfolio/projects/personal-workspace">查看项目介绍 ↗</Link></div></div>
      <span className="portfolio-mock-caption">自绘界面结构示意，不包含私人数据</span>
    </div>
  </div>;
}
