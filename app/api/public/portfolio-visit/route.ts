import { NextResponse, type NextRequest } from "next/server";

import { browserCategory, deviceCategory, publicPortfolioPath } from "@/lib/portfolio/analytics-policy";
import { analyticsConfigured, newVisitorCookie, recordPortfolioVisit, visitorCookieName } from "@/lib/portfolio/analytics-server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  // Next.js can canonicalize nextUrl to localhost while the browser uses 127.0.0.1.
  // Compare the browser origin to the actual Host header, including its port.
  let sameOrigin = false;
  try { sameOrigin = Boolean(origin && new URL(origin).host === request.headers.get("host")); } catch { /* malformed Origin */ }
  if (!sameOrigin) return NextResponse.json({ status: "rejected" }, { status: 403 });
  if (!analyticsConfigured()) return NextResponse.json({ status: "not_configured" }, { status: 503 });
  if (Number(request.headers.get("content-length") ?? 0) > 1024) return NextResponse.json({ status: "rejected" }, { status: 413 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ status: "rejected" }, { status: 400 }); }
  if (!payload || typeof payload !== "object") return NextResponse.json({ status: "rejected" }, { status: 400 });
  const input = payload as Record<string, unknown>;
  const path = typeof input.path === "string" ? publicPortfolioPath(input.path) : null;
  if (!path || typeof input.eventId !== "string" || !/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(input.eventId)) return NextResponse.json({ status: "rejected" }, { status: 400 });
  const suppliedCookie = request.cookies.get(visitorCookieName)?.value;
  const cookie = suppliedCookie && /^[A-Za-z0-9_-]{32}$/.test(suppliedCookie) ? suppliedCookie : newVisitorCookie();
  const agent = request.headers.get("user-agent") ?? "";
  const allowedSources = ["直接访问", "站内导航", "搜索引擎", "社交平台", "其他引荐"];
  if (typeof input.source !== "string" || !allowedSources.includes(input.source)) return NextResponse.json({ status: "rejected" }, { status: 400 });
  try {
    const result = await recordPortfolioVisit({ eventId: input.eventId, cookie, path, device: deviceCategory(agent), browser: browserCategory(agent), source: input.source });
    const response = NextResponse.json({ status: result }, { headers: { "Cache-Control": "no-store" } });
    if (!suppliedCookie || suppliedCookie !== cookie) response.cookies.set(visitorCookieName, cookie, { httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:", path: "/", maxAge: 60 * 60 * 24 * 365 });
    return response;
  } catch {
    return NextResponse.json({ status: "error" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
