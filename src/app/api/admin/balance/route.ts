import { NextRequest, NextResponse } from "next/server";
import { requireAnyAdmin } from "@/lib/apiAuth";
import { editBalance, getAdminAssignment } from "@/lib/gameState";

export async function POST(req: NextRequest) {
  const session = requireAnyAdmin(req);
  if (session instanceof NextResponse) return session;

  const { teamId, delta, reason } = await req.json();

  if (session.role === "admin") {
    const assignedTeam = await getAdminAssignment(session.teamId);
    if (!assignedTeam || assignedTeam !== teamId) {
      return NextResponse.json({ error: "Cannot modify other teams' balances" }, { status: 403 });
    }
  }

  const result = await editBalance(teamId, Number(delta), reason);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
