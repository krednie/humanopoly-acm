import { NextRequest, NextResponse } from "next/server";
import { decodeSession, COOKIE_NAME } from "./auth";
import type { Session } from "./auth";

/**
 * Validates the session cookie and enforces a required role.
 * Returns the Session on success, or a 401 NextResponse on failure.
 *
 * Usage:
 *   const session = requireSession(req, "admin");
 *   if (session instanceof NextResponse) return session;
 */
export function requireSession(
  req: NextRequest,
  role: "admin" | "player"
): Session | NextResponse {
  const val = req.cookies.get(COOKIE_NAME)?.value;
  const session = val ? decodeSession(val) : null;
  if (!session || session.role !== role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}
