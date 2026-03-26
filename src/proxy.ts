import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, decodeSession } from "@/lib/auth";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const cookieVal = req.cookies.get(COOKIE_NAME)?.value;
  const session = cookieVal ? decodeSession(cookieVal) : null;

  if (pathname.startsWith("/player")) {
    if (!session || session.role !== "player") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!session || session.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/player/:path*", "/admin/:path*"],
};
