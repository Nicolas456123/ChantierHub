import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get("chantierhub-auth");
  const pseudoCookie = request.cookies.get("chantierhub-pseudo");
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === "/login";
  const isApiAuth = pathname.startsWith("/api/auth");
  const isApi = pathname.startsWith("/api/");

  if (isLoginPage || isApiAuth) {
    return NextResponse.next();
  }

  if (!authCookie || !pseudoCookie) {
    if (isApi) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads/).*)"],
};
