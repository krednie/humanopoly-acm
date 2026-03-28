import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/apiAuth";
import { editBalance } from "@/lib/gameState";

export async function POST(req: NextRequest) {
  const session = requireSession(req, "admin");
  if (session instanceof NextResponse) return session;

  const { teamId, delta, reason } = await req.json();
  const result = await editBalance(teamId, Number(delta), reason);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
