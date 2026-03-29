import { NextRequest, NextResponse } from "next/server";
import { requireAnyAdmin } from "@/lib/apiAuth";
import { assignProperty, getAdminAssignment } from "@/lib/gameState";
import { db } from "@/db";
import { propertiesState } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = requireAnyAdmin(req);
  if (session instanceof NextResponse) return session;

  const { propertyId, teamId } = await req.json();

  if (session.role === "admin") {
    const assignedTeam = await getAdminAssignment(session.teamId);
    if (!assignedTeam) return NextResponse.json({ error: "Not assigned to a team" }, { status: 403 });

    if (teamId) {
      if (teamId !== assignedTeam) {
        return NextResponse.json({ error: "Cannot assign properties to other teams" }, { status: 403 });
      }
    } else {
      // Unassigning. Must be owned by their assigned team.
      const rows = await db.select().from(propertiesState).where(eq(propertiesState.propertyId, propertyId)).limit(1);
      const prop = rows[0];
      if (!prop) return NextResponse.json({ error: "Property not found" }, { status: 404 });
      if (prop.owner !== assignedTeam) {
        return NextResponse.json({ error: "Cannot vacate properties owned by other teams" }, { status: 403 });
      }
    }
  }

  const result = await assignProperty(propertyId, teamId ?? null);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
