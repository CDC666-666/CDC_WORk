import { NextResponse, type NextRequest } from "next/server";

import { readPortfolioAnalytics } from "@/lib/portfolio/analytics-server";
import type { AnalyticsPeriod } from "@/types/portfolio-analytics";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const value = Number(request.nextUrl.searchParams.get("days") ?? "30");
  const period: AnalyticsPeriod = value === 7 || value === 30 || value === 90 ? value : 30;
  const data = await readPortfolioAnalytics(period);
  return NextResponse.json(data, { status: data.status === "error" ? 503 : 200, headers: { "Cache-Control": "no-store" } });
}
