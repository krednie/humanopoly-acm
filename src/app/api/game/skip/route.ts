import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/apiAuth";
import { clearPush } from "@/lib/gameState";

export async function POST(req: NextRequest) {
  const session = requireSession(req, "player");
  if (session instanceof NextResponse) return session;

  await clearPush(session.teamId);
  return NextResponse.json({ ok: true });
}
