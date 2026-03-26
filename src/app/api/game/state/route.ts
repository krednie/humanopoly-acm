import { NextRequest, NextResponse } from "next/server";
import { decodeSession, COOKIE_NAME } from "@/lib/auth";
import { getState } from "@/lib/gameState";
import { TASKS } from "@/lib/data/tasks";

export async function GET(req: NextRequest) {
  const cookieVal = req.cookies.get(COOKIE_NAME)?.value;
  const session = cookieVal ? decodeSession(cookieVal) : null;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const s = getState();

  if (session.role === "admin") {
    return NextResponse.json({
      teams: s.teams,
      properties: s.properties,
      currentPush: s.currentPush,
      pendingApprovals: s.pendingApprovals,
      transactions: s.transactions,
      taskUsage: s.taskUsage,
      tasks: TASKS,
    });
  }

  // Player: return their own data + leaderboard + current push
  const myTeam = s.teams[session.teamId];
  const myPush = s.currentPush[session.teamId];
  const myPending = s.pendingApprovals.filter(
    (a) => a.teamId === session.teamId && a.status === "pending"
  );
  const myTx = s.transactions.filter((t) => t.teamId === session.teamId).slice(0, 30);

  const leaderboard = Object.values(s.teams)
    .map((t) => {
      const propValue = t.ownedProperties.reduce(
        (sum, pid) => sum + (s.properties[pid]?.price ?? 0),
        0
      );
      return { teamId: t.teamId, displayName: t.displayName, balance: t.balance, netWorth: t.balance + propValue };
    })
    .sort((a, b) => b.netWorth - a.netWorth);

  // Resolve push details
  let pushDetail = null;
  if (myPush) {
    const prop = s.properties[myPush.propertyId];
    const task = myPush.taskId ? TASKS.find((t) => t.taskId === myPush.taskId) : null;
    pushDetail = { property: prop, task, pushedAt: myPush.pushedAt };
  }

  return NextResponse.json({
    team: myTeam,
    push: pushDetail,
    pendingApprovals: myPending,
    transactions: myTx,
    leaderboard,
    properties: s.properties,
  });
}
