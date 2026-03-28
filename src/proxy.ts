import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, decodeSession } from "@/lib/auth";

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const val = req.cookies.get(COOKIE_NAME)?.value;
  const session = val ? decodeSession(val) : null;

  if (pathname.startsWith("/player") && session?.role !== "player")
    return NextResponse.redirect(new URL("/", req.url));

  if (pathname.startsWith("/admin") && session?.role !== "admin")
    return NextResponse.redirect(new URL("/", req.url));

  return NextResponse.next();
}

export const config = {
  matcher: ["/player/:path*", "/admin/:path*"],
};
