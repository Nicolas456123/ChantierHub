import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get("chantierhub-session");
  const { pathname } = request.nextUrl;

  // Public routes - no auth needed
  if (pathname === "/login" || pathname === "/register") {
    // If already logged in, redirect to home
    if (sessionCookie) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // API auth routes are public
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // Everything else requires auth
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
