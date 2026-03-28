import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/apiAuth";
import { assignProperty } from "@/lib/gameState";

export async function POST(req: NextRequest) {
  const session = requireSession(req, "admin");
  if (session instanceof NextResponse) return session;

  const { propertyId, teamId } = await req.json();
  const result = await assignProperty(propertyId, teamId ?? null);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
