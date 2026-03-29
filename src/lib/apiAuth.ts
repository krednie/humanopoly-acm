import { NextRequest, NextResponse } from "next/server";
import { decodeSession, COOKIE_NAME } from "./auth";
import type { Session } from "./auth";

/**
 * Validates the session cookie and enforces a required role.
 * Returns the Session on success, or a 401 NextResponse on failure.
 */
export function requireSession(
  req: NextRequest,
  role: "admin" | "player" | "superadmin"
): Session | NextResponse {
  const val = req.cookies.get(COOKIE_NAME)?.value;
  const session = val ? decodeSession(val) : null;
  if (!session || session.role !== role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}

/**
 * Accepts either admin or superadmin role.
 * Used for endpoints that both team admins and super admins can access.
 */
export function requireAnyAdmin(req: NextRequest): Session | NextResponse {
  const val = req.cookies.get(COOKIE_NAME)?.value;
  const session = val ? decodeSession(val) : null;
  if (!session || (session.role !== "admin" && session.role !== "superadmin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}
