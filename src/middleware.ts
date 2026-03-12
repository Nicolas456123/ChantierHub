import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get("chantierhub-session");
  const projectCookie = request.cookies.get("chantierhub-project");
  const { pathname } = request.nextUrl;

  // Public routes - no auth needed
  if (pathname === "/login" || pathname === "/register") {
    if (sessionCookie) {
      return NextResponse.redirect(new URL("/projects", request.url));
    }
    return NextResponse.next();
  }

  // API auth routes are public
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // Not logged in → login
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Project selection page and project API routes - need auth but no project
  if (pathname === "/projects" || pathname.startsWith("/api/projects")) {
    return NextResponse.next();
  }

  // No project selected → go to project selection
  if (!projectCookie) {
    return NextResponse.redirect(new URL("/projects", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
