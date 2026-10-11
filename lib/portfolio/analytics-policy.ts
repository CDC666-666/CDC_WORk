import { publicProjects } from "@/data/public-portfolio";

export const portfolioTimeZone = "Asia/Shanghai";

const staticPaths = new Set(["/portfolio", "/portfolio/projects", "/portfolio/about", "/portfolio/stats", "/portfolio/contact"]);
const projectPaths = new Set(publicProjects.map((project) => `/portfolio/projects/${project.slug}`));

export function publicPortfolioPath(path: string): string | null {
  const normalized = path.replace(/\/+$/, "") || "/";
  return staticPaths.has(normalized) || projectPaths.has(normalized) ? normalized : null;
}

export function pageTitle(path: string): string {
  if (path === "/portfolio") return "首页";
  if (path === "/portfolio/projects") return "项目列表";
  if (path === "/portfolio/about") return "关于我";
  if (path === "/portfolio/stats") return "站点统计";
  if (path === "/portfolio/contact") return "联系";
  return publicProjects.find((project) => `/portfolio/projects/${project.slug}` === path)?.title ?? "公开页面";
}

export function shanghaiParts(date: Date): { date: string; weekday: number; hour: number } {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: portfolioTimeZone, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short", hour: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const weekdays: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  return { date: `${get("year")}-${get("month")}-${get("day")}`, weekday: weekdays[get("weekday")] ?? 0, hour: Number(get("hour")) };
}

export function deviceCategory(userAgent: string): string {
  if (/ipad|tablet/i.test(userAgent)) return "平板";
  if (/mobile|iphone|android/i.test(userAgent)) return "手机";
  return "桌面";
}

export function browserCategory(userAgent: string): string {
  if (/edg\//i.test(userAgent)) return "Edge";
  if (/firefox\//i.test(userAgent)) return "Firefox";
  if (/chrome\//i.test(userAgent)) return "Chrome";
  if (/safari\//i.test(userAgent)) return "Safari";
  return "其他";
}

export function sourceCategory(referrer: string, origin: string): string {
  if (!referrer || referrer.length > 2048) return "直接访问";
  try {
    const url = new URL(referrer);
    if (url.origin === origin) return "站内导航";
    if (/^(www\.)?(google|bing|baidu|duckduckgo|sogou)\./i.test(url.hostname)) return "搜索引擎";
    if (/(^|\.)(github\.com|bilibili\.com|weixin\.qq\.com|zhihu\.com|x\.com)$/i.test(url.hostname)) return "社交平台";
    return "其他引荐";
  } catch { return "直接访问"; }
}
