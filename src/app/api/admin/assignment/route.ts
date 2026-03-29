import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/apiAuth";
import { setAdminAssignment } from "@/lib/gameState";

export async function POST(req: NextRequest) {
  const session = requireSession(req, "superadmin");
  if (session instanceof NextResponse) return session;

  const { adminId, teamId } = await req.json();

  if (!adminId) {
    return NextResponse.json({ error: "adminId is required" }, { status: 400 });
  }

  await setAdminAssignment(adminId, teamId ?? null);
  return NextResponse.json({ ok: true });
}
