import { publicCapabilities, publicPortfolio, publicProjects } from "@/data/public-portfolio";

/** Explicitly curated public content boundary. A future publish workflow replaces
 * this source only after field review; it must never enumerate private entities. */
export function getPublicPortfolio() { return publicPortfolio; }
export function listPublicProjects() { return publicProjects; }
export function listPublicCapabilities() { return publicCapabilities; }
export function findPublicProject(slug: string) { return publicProjects.find((project) => project.slug === slug); }
