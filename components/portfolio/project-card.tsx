import Link from "next/link";
import Image from "next/image";

import { ProjectVisual } from "@/components/portfolio/project-visual";
import type { PublicProject } from "@/types/public-portfolio";

export function ProjectCard({ project }: { project: PublicProject }) {
  return <article className="portfolio-project-card">
    <Link className="portfolio-project-art" href={`/portfolio/projects/${project.slug}`} aria-label={`查看${project.title}详情`}>
      {project.showcaseVideoPoster
        ? <Image className="portfolio-project-poster" src={project.showcaseVideoPoster} alt={`${project.title}现场视频封面`} width={1280} height={720} />
        : <ProjectVisual kind={project.visual} />}
    </Link>
    <div className="portfolio-project-body">
      <div className="portfolio-project-meta"><span>PROJECT / {project.number}</span><span className="portfolio-status">{project.status}</span></div>
      <p className="portfolio-project-time">项目起止时间：{project.startDate ?? "待补充"}{project.startDate ? ` — ${project.endDate ?? "进行中"}` : ""}</p>
      <h3><Link href={`/portfolio/projects/${project.slug}`}>{project.title}</Link></h3>
      <p>{project.summary}</p>
      <p className="portfolio-project-role"><strong>我的职责</strong>{project.role}</p>
      <div className="portfolio-tags">{project.technologies.map((tag) => <span key={tag}>{tag}</span>)}</div>
      <div className="portfolio-project-actions"><Link className="portfolio-text-link" href={`/portfolio/projects/${project.slug}`}>查看项目详情 ↗</Link>{project.repositoryUrl && <a className="portfolio-text-link" href={project.repositoryUrl} target="_blank" rel="noopener noreferrer">GitHub ↗</a>}</div>
    </div>
  </article>;
}
