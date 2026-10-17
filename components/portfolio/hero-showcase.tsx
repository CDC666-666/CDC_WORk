"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { ProjectVisual } from "@/components/portfolio/project-visual";
import type { PublicProject } from "@/types/public-portfolio";

// Match the first portfolio version's cylindrical ring and travel speed.
// Repeated cards are views of the same three projects.
const cardCount = 21;
const radius = 670;
const step = 360 / cardCount;

function ShowcaseMedia({ project, onPlayingChange }: { project: PublicProject; onPlayingChange: (playing: boolean) => void }) {
  const [failed, setFailed] = useState(false);
  if (!project.showcaseVideoSrc || failed) return <ProjectVisual kind={project.visual} />;
  return <video controls playsInline preload="none" poster={project.showcaseVideoPoster} aria-label={`${project.showcaseTitle ?? project.title}的视频`}
    onPlay={() => onPlayingChange(true)} onPause={() => onPlayingChange(false)} onEnded={() => onPlayingChange(false)} onError={() => { onPlayingChange(false); setFailed(true); }}>
    <source src={project.showcaseVideoSrc} type="video/mp4" />
    浏览器不支持此视频。
  </video>;
}

export function HeroShowcase({ projects }: { projects: readonly PublicProject[] }) {
  const [paused, setPaused] = useState(false);
  const [playing, setPlaying] = useState(false);
  const phase = useRef(0);
  const showcase = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = showcase.current;
    const cards = Array.from(ring.current?.children ?? []) as HTMLElement[];
    if (!root || cards.length === 0) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = true;
    let frame = 0;
    let last = 0;
    const enabled = () => !paused && !playing && visible && !document.hidden && !motion.matches;
    const place = () => {
      cards.forEach((card, index) => {
        const angle = ((index * step + phase.current + 540) % 360) - 180;
        const radians = angle * Math.PI / 180;
        const shown = Math.abs(angle) <= 52;
        card.style.visibility = shown ? "visible" : "hidden";
        card.style.transform = `translate3d(${radius * Math.sin(radians)}px, 0, ${radius * (1 - Math.cos(radians))}px) rotateY(${-angle}deg)`;
        card.style.filter = `brightness(${Math.max(.55, 1 - Math.abs(angle) / 115)})`;
        card.style.zIndex = String(Math.round(100 - Math.abs(angle)));
        if (card.inert === shown) card.inert = !shown;
        const ariaHidden = shown ? "false" : "true";
        if (card.getAttribute("aria-hidden") !== ariaHidden) card.setAttribute("aria-hidden", ariaHidden);
      });
    };
    const tick = (now: number) => {
      frame = 0;
      if (!enabled()) { last = 0; return; }
      if (last) phase.current -= 1.5 * Math.min((now - last) / 1000, .1);
      last = now;
      place();
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      place();
      if (enabled() && !frame) frame = requestAnimationFrame(tick);
      if (!enabled() && frame) { cancelAnimationFrame(frame); frame = 0; last = 0; }
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: .15 });
    observer.observe(root);
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    sync();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
    };
  }, [paused, playing, projects.length]);

  return <div className="portfolio-showcase portfolio-project-orbit" ref={showcase} onFocusCapture={() => setPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }} aria-label="三个公开项目沿第一版透视卡片环连续轮播">
    <div className="portfolio-project-orbit-stage" ref={ring}>
      {Array.from({ length: cardCount }, (_, index) => {
        const project = projects[index % projects.length];
        if (!project) return null;
        const content = <><div className="portfolio-orbit-media"><ShowcaseMedia project={project} onPlayingChange={setPlaying} /></div><div className="portfolio-orbit-card-copy"><span>{project.number} / {project.direction}</span><h2>{project.showcaseVideoSrc ? <Link href={`/portfolio/projects/${project.slug}`}>{project.showcaseTitle ?? project.title}</Link> : project.showcaseTitle ?? project.title}</h2><p>{project.showcaseSummary ?? project.summary}</p></div></>;
        return project.showcaseVideoSrc
          ? <article className="portfolio-orbit-card" data-orbit-card key={`${project.slug}-${index}`}>{content}</article>
          : <Link className="portfolio-orbit-card" data-orbit-card href={`/portfolio/projects/${project.slug}`} key={`${project.slug}-${index}`} aria-label={`查看${project.showcaseTitle ?? project.title}详情`}>{content}</Link>;
      })}
    </div>
    <div className="portfolio-orbit-caption"><span>PROJECTS / 01—03</span><span>连续轮播 · 点击项目查看详情</span></div>
  </div>;
}
