import { NextResponse, type NextRequest } from "next/server";

/** Early redirect only. The private layout and every API verify the database session. */
export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get("next-auth.session-token") ??
    request.cookies.get("__Secure-next-auth.session-token");
  if (sessionCookie) return NextResponse.next();
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!api|login|_next|favicon.ico|.*\\.[^/]+$).*)"],
};
