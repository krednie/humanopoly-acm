import { NextRequest, NextResponse } from "next/server";
import { requireAnyAdmin } from "@/lib/apiAuth";
import { pushProperty, clearPush, getAdminAssignment } from "@/lib/gameState";

export async function POST(req: NextRequest) {
  const session = requireAnyAdmin(req);
  if (session instanceof NextResponse) return session;

  const { teamId, propertyId, clear } = await req.json();

  if (session.role === "admin") {
    const assignedTeam = await getAdminAssignment(session.teamId);
    if (!assignedTeam || assignedTeam !== teamId) {
      return NextResponse.json({ error: "Cannot modify other teams" }, { status: 403 });
    }
  }

  if (clear) {
    await clearPush(teamId);
    return NextResponse.json({ ok: true });
  }
  const result = await pushProperty(teamId, propertyId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
