import { NextRequest, NextResponse } from "next/server";
import { requireAnyAdmin } from "@/lib/apiAuth";
import { processApproval, getAdminAssignment } from "@/lib/gameState";
import { db } from "@/db";
import { pendingApprovals } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = requireAnyAdmin(req);
  if (session instanceof NextResponse) return session;

  const { approvalId, decision } = await req.json();

  if (session.role === "admin") {
    const assignedTeam = await getAdminAssignment(session.teamId);
    if (!assignedTeam) return NextResponse.json({ error: "Not assigned to a team" }, { status: 403 });

    const rows = await db.select().from(pendingApprovals).where(eq(pendingApprovals.id, approvalId)).limit(1);
    const approval = rows[0];
    if (!approval) return NextResponse.json({ error: "Approval not found" }, { status: 404 });
    if (approval.teamId !== assignedTeam) {
      return NextResponse.json({ error: "Cannot process approvals for other teams" }, { status: 403 });
    }
  }

  const result = await processApproval(approvalId, decision);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
