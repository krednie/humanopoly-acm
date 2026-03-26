import { NextRequest, NextResponse } from "next/server";
import { decodeSession, COOKIE_NAME } from "@/lib/auth";
import { processApproval } from "@/lib/gameState";

export async function POST(req: NextRequest) {
  const cookieVal = req.cookies.get(COOKIE_NAME)?.value;
  const session = cookieVal ? decodeSession(cookieVal) : null;
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { approvalId, decision } = await req.json();
  const result = processApproval(approvalId, decision);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
