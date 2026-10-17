import "server-only";

import { createHmac, randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/server/prisma";
import { pageTitle, publicPortfolioPath, shanghaiParts } from "@/lib/portfolio/analytics-policy";
import type { AnalyticsPeriod, PortfolioAnalytics, PortfolioAnalyticsResponse } from "@/types/portfolio-analytics";

export const visitorCookieName = "cdc_portfolio_visitor";

export function analyticsConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.PORTFOLIO_ANALYTICS_SECRET && process.env.PORTFOLIO_ANALYTICS_SECRET.length >= 32);
}

export function newVisitorCookie(): string { return randomBytes(24).toString("base64url"); }

export function visitorDigest(cookie: string): string {
  return createHmac("sha256", process.env.PORTFOLIO_ANALYTICS_SECRET!).update(cookie).digest("hex");
}

export async function recordPortfolioVisit(input: { eventId: string; cookie: string; path: string; device: string; browser: string; source: string }): Promise<"recorded" | "duplicate" | "limited"> {
  const visitorId = visitorDigest(input.cookie);
  const now = new Date();
  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.portfolioPageView.findUnique({ where: { eventId: input.eventId }, select: { eventId: true } });
      if (existing) return "duplicate";
      const recentCount = await tx.portfolioPageView.count({ where: { visitorId, occurredAt: { gte: new Date(now.getTime() - 60_000) } } });
      if (recentCount >= 20) return "limited";
      await tx.portfolioVisitor.upsert({ where: { id: visitorId }, create: { id: visitorId }, update: {} });
      await tx.portfolioPageView.create({ data: { eventId: input.eventId, visitorId, path: input.path, device: input.device, browser: input.browser, source: input.source, occurredAt: now } });
      return "recorded";
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return "duplicate";
    throw error;
  }
}

function previousDateKey(today: string, offset: number): string {
  // Asia/Shanghai has no DST: local noon avoids midnight rounding ambiguity.
  const noon = new Date(`${today}T12:00:00+08:00`);
  return shanghaiParts(new Date(noon.getTime() - offset * 86_400_000)).date;
}

function countBy(items: string[]): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  return Array.from(counts, ([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}

export async function readPortfolioAnalytics(period: AnalyticsPeriod): Promise<PortfolioAnalyticsResponse> {
  if (!analyticsConfigured()) return { status: "not_configured", message: "尚未接入统计" };
  const now = new Date();
  const today = shanghaiParts(now).date;
  const oldestKey = previousDateKey(today, 89);
  const oldestUtc = new Date(`${oldestKey}T00:00:00+08:00`);
  try {
    const [visitors, views, recent, latest, popularRows] = await Promise.all([
      prisma.portfolioVisitor.count(),
      prisma.portfolioPageView.count(),
      prisma.portfolioPageView.findMany({ where: { occurredAt: { gte: oldestUtc } }, select: { visitorId: true, path: true, device: true, browser: true, source: true, occurredAt: true } }),
      prisma.portfolioPageView.findFirst({ orderBy: { occurredAt: "desc" }, select: { occurredAt: true } }),
      prisma.portfolioPageView.groupBy({ by: ["path"], _count: { eventId: true }, orderBy: { _count: { eventId: "desc" } }, take: 20 }),
    ]);
    const days = Array.from({ length: period }, (_, index) => previousDateKey(today, period - 1 - index));
    const dailyViews = new Map<string, number>();
    const dailyVisitors = new Map<string, Set<string>>();
    const heatmap = Array.from({ length: 7 * 24 }, (_, index) => ({ weekday: Math.floor(index / 24), hour: index % 24, views: 0 }));
    const thirtyStart = previousDateKey(today, 29);
    const devices: string[] = [], browsers: string[] = [], sources: string[] = [];
    for (const view of recent) {
      const local = shanghaiParts(view.occurredAt);
      dailyViews.set(local.date, (dailyViews.get(local.date) ?? 0) + 1);
      if (!dailyVisitors.has(local.date)) dailyVisitors.set(local.date, new Set());
      dailyVisitors.get(local.date)!.add(view.visitorId);
      if (local.date >= thirtyStart) {
        heatmap[local.weekday * 24 + local.hour].views++;
        devices.push(view.device); browsers.push(view.browser); sources.push(view.source);
      }
    }
    return {
      status: "ok", period,
      totals: { visitors, views, todayVisitors: dailyVisitors.get(today)?.size ?? 0, todayViews: dailyViews.get(today) ?? 0 },
      trend: days.map((date) => ({ date, visitors: dailyVisitors.get(date)?.size ?? 0, views: dailyViews.get(date) ?? 0 })),
      popular: popularRows.filter((row) => publicPortfolioPath(row.path)).slice(0, 5).map((row) => ({ path: row.path, title: pageTitle(row.path), views: row._count.eventId })),
      devices: countBy(devices), browsers: countBy(browsers), sources: countBy(sources), heatmap,
      refreshedAt: now.toISOString(), lastVisitAt: latest?.occurredAt.toISOString() ?? null,
    } satisfies PortfolioAnalytics;
  } catch {
    return { status: "error", message: "统计服务暂时不可用" };
  }
}
