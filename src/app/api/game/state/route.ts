import { NextRequest, NextResponse } from "next/server";
import { decodeSession, COOKIE_NAME } from "@/lib/auth";
import { getAdminState, getTeamAdminState, getPlayerState, getAdminAssignment } from "@/lib/gameState";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cookieVal = req.cookies.get(COOKIE_NAME)?.value;
  const session = cookieVal ? decodeSession(cookieVal) : null;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.role === "superadmin") {
    const state = await getAdminState();
    return NextResponse.json(state);
  }

  if (session.role === "admin") {
    const assignedTeam = await getAdminAssignment(session.teamId);
    if (!assignedTeam) return NextResponse.json({ notAssigned: true });
    const state = await getTeamAdminState(assignedTeam);
    return NextResponse.json({ ...state, myAssignedTeam: assignedTeam });
  }

  const state = await getPlayerState(session.teamId);
  if (!state) return NextResponse.json({ error: "Team not found" }, { status: 404 });
  return NextResponse.json(state);
}
