import { NextRequest, NextResponse } from "next/server";
import { decodeSession, COOKIE_NAME } from "@/lib/auth";
import { pushProperty, clearPush } from "@/lib/gameState";

export async function POST(req: NextRequest) {
  const cookieVal = req.cookies.get(COOKIE_NAME)?.value;
  const session = cookieVal ? decodeSession(cookieVal) : null;
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { teamId, propertyId, clear } = await req.json();
  if (clear) {
    await clearPush(teamId);
    return NextResponse.json({ ok: true });
  }
  const result = await pushProperty(teamId, propertyId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
