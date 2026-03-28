import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/apiAuth";
import { pushProperty, clearPush } from "@/lib/gameState";

export async function POST(req: NextRequest) {
  const session = requireSession(req, "admin");
  if (session instanceof NextResponse) return session;

  const { teamId, propertyId, clear } = await req.json();
  if (clear) {
    await clearPush(teamId);
    return NextResponse.json({ ok: true });
  }
  const result = await pushProperty(teamId, propertyId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
