import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/apiAuth";
import { submitRequest } from "@/lib/gameState";

const VALID_TYPES = ["task_money", "task_property", "buy", "rent"] as const;
type RequestType = (typeof VALID_TYPES)[number];

export async function POST(req: NextRequest) {
  const session = requireSession(req, "player");
  if (session instanceof NextResponse) return session;

  const { type, propertyId, taskId } = await req.json();
  if (!VALID_TYPES.includes(type as RequestType)) {
    return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
  }
  const result = await submitRequest(session.teamId, type as RequestType, propertyId, taskId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, id: result.id });
}
