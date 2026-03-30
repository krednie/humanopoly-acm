import { NextResponse } from "next/server";
import { updateTeamName } from "@/lib/gameState";

export async function POST(req: Request) {
  try {
    const { teamId, displayName } = await req.json();

    const res = await updateTeamName(teamId, displayName);

    if (!res.ok) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}