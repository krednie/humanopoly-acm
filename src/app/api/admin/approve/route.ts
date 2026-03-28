import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/apiAuth";
import { processApproval } from "@/lib/gameState";

export async function POST(req: NextRequest) {
  const session = requireSession(req, "admin");
  if (session instanceof NextResponse) return session;

  const { approvalId, decision } = await req.json();
  const result = await processApproval(approvalId, decision);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
