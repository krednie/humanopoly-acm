import { NextRequest, NextResponse } from "next/server";
import { decodeSession, COOKIE_NAME } from "@/lib/auth";
import { clearPush } from "@/lib/gameState";

export async function POST(req: NextRequest) {
  const cookieVal = req.cookies.get(COOKIE_NAME)?.value;
  const session = cookieVal ? decodeSession(cookieVal) : null;
  if (!session || session.role !== "player") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await clearPush(session.teamId);
  return NextResponse.json({ ok: true });
}
