import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  const launchedAt = process.env.PORTFOLIO_LAUNCHED_AT?.trim() || null;
  return NextResponse.json({
    icpNumber: process.env.SITE_ICP_NUMBER?.trim() || null,
    icpName: process.env.SITE_ICP_NAME?.trim() || null,
    policeNumber: process.env.SITE_POLICE_NUMBER?.trim() || null,
    launchedAt: launchedAt && Number.isFinite(Date.parse(launchedAt)) ? launchedAt : null,
  }, { headers: { "Cache-Control": "no-store" } });
}
