import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/apiAuth";
import { seedDatabase } from "@/lib/gameState";

export async function POST(req: NextRequest) {
  // Only superadmin can reset game
  const session = requireSession(req, "superadmin");
  if (session instanceof NextResponse) return session;

  await seedDatabase();
  return NextResponse.json({ ok: true, message: "Game reset and database seeded." });
}
