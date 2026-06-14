import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE = "meridian-auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths — never require auth
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const expected = process.env.VIEWER_PASSWORD_HASH;

  // No password configured (local dev) → allow access
  if (!expected) return NextResponse.next();

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (token !== expected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
