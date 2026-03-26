import { NextRequest, NextResponse } from "next/server";
import { decodeSession, COOKIE_NAME } from "@/lib/auth";
import { submitRequest } from "@/lib/gameState";

export async function POST(req: NextRequest) {
  const cookieVal = req.cookies.get(COOKIE_NAME)?.value;
  const session = cookieVal ? decodeSession(cookieVal) : null;
  if (!session || session.role !== "player") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { type, propertyId, taskId } = await req.json();
  const result = await submitRequest(session.teamId, type, propertyId, taskId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, id: result.id });
}
