import { NextResponse, type NextRequest } from "next/server";

/** Early redirect only. The private layout and every API verify the database session. */
export function middleware(request: NextRequest) {
  // The curated portfolio is public; all existing Workspace pages remain private.
  if (request.nextUrl.pathname === "/portfolio" || request.nextUrl.pathname.startsWith("/portfolio/")) {
    return NextResponse.next();
  }
  const sessionCookie = request.cookies.get("next-auth.session-token") ??
    request.cookies.get("__Secure-next-auth.session-token");
  if (sessionCookie) return NextResponse.next();
  const login = new URL("/login", request.url);
  if (request.nextUrl.pathname === "/migration") login.searchParams.set("callbackUrl", "/migration");
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!api|login|_next|favicon.ico|.*\\.[^/]+$).*)"],
};
