import { NextRequest, NextResponse } from "next/server";
import { findCredential, encodeSession, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  const cred = findCredential(username, password);
  if (!cred) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }
  const session = { teamId: cred.teamId, displayName: cred.displayName, role: cred.role };
  const encoded = encodeSession(session);
  const res = NextResponse.json({ ok: true, role: cred.role });
  res.cookies.set(COOKIE_NAME, encoded, { httpOnly: true, path: "/", sameSite: "lax" });
  return res;
}
