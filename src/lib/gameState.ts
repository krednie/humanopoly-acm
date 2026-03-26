/**
 * gameState.ts — Neon Postgres backend via Drizzle ORM.
 * All functions are async. The DB is seeded automatically on first use.
 */

import { db } from "@/db";
import {
  teamsState, propertiesState, currentPush,
  pendingApprovals, transactions, taskUsage,
} from "@/db/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import { CREDENTIALS } from "./data/credentials";
import { PROPERTIES } from "./data/properties";
import { TASKS } from "./data/tasks";

// ─── Types (same public shape as before) ─────────────────────────────────────

export type PropertyStatus = "vacant" | "owned" | "locked";
export type ApprovalType = "task" | "buy" | "rent";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface PropertyState {
  propertyId: string; name: string; price: number; rent: number;
  owner: string | null; status: string;
}
export interface TeamState {
  teamId: string; displayName: string; balance: number; ownedProperties: string[];
}
export interface CurrentPush {
  propertyId: string; taskId: number | null; pushedAt: number;
}
export interface PendingApproval {
  id: string; type: string; teamId: string; propertyId: string;
  taskId?: number | null; amount: number; timestamp: number; status: string;
}
export interface Transaction {
  id: string; type: string; teamId: string; amount: number;
  propertyId?: string | null; description: string; timestamp: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function pickTask(): Promise<number | null> {
  const top = await db.select().from(taskUsage).orderBy(asc(taskUsage.uses), asc(taskUsage.taskId)).limit(1);
  return top[0]?.taskId ?? (TASKS[0]?.taskId ?? null);
}

// ─── Seed / Reset ─────────────────────────────────────────────────────────────

export async function seedDatabase(): Promise<void> {
  await db.delete(transactions);
  await db.delete(pendingApprovals);
  await db.delete(currentPush);
  await db.delete(propertiesState);
  await db.delete(teamsState);
  await db.delete(taskUsage);

  for (const c of CREDENTIALS) {
    if (c.role === "player") {
      await db.insert(teamsState).values({
        teamId: c.teamId, displayName: c.displayName,
        balance: c.startingBalance, ownedProperties: [],
      });
    }
  }
  for (const p of PROPERTIES) {
    await db.insert(propertiesState).values({
      propertyId: p.propertyId, name: p.name,
      price: p.price, rent: p.rent, owner: null, status: "vacant",
    });
  }
  for (const t of TASKS) {
    await db.insert(taskUsage).values({ taskId: t.taskId, uses: 0 });
  }
}

export async function ensureSeeded(): Promise<void> {
  const existing = await db.select().from(teamsState).limit(1);
  if (existing.length === 0) await seedDatabase();
}

// ─── Read: Admin state ────────────────────────────────────────────────────────

export async function getAdminState() {
  await ensureSeeded();
  const [teams, properties, pushes, approvals, txs] = await Promise.all([
    db.select().from(teamsState),
    db.select().from(propertiesState),
    db.select().from(currentPush),
    db.select().from(pendingApprovals).orderBy(desc(pendingApprovals.timestamp)).limit(200),
    db.select().from(transactions).orderBy(desc(transactions.timestamp)).limit(200),
  ]);

  const teamsRecord: Record<string, TeamState> = {};
  for (const t of teams) teamsRecord[t.teamId] = { ...t, ownedProperties: (t.ownedProperties as string[]) ?? [] };

  const propertiesRecord: Record<string, PropertyState> = {};
  for (const p of properties) propertiesRecord[p.propertyId] = p as PropertyState;

  const pushRecord: Record<string, CurrentPush | null> = {};
  for (const teamId of Object.keys(teamsRecord)) pushRecord[teamId] = null;
  for (const push of pushes) pushRecord[push.teamId] = { propertyId: push.propertyId, taskId: push.taskId, pushedAt: push.pushedAt };

  return {
    teams: teamsRecord,
    properties: propertiesRecord,
    currentPush: pushRecord,
    pendingApprovals: approvals as PendingApproval[],
    transactions: txs as Transaction[],
    tasks: TASKS,
  };
}

// ─── Read: Player state ───────────────────────────────────────────────────────

export async function getPlayerState(teamId: string) {
  await ensureSeeded();
  const [teamRows, properties, pushRows, myPending, myTx, allTeams] = await Promise.all([
    db.select().from(teamsState).where(eq(teamsState.teamId, teamId)),
    db.select().from(propertiesState),
    db.select().from(currentPush).where(eq(currentPush.teamId, teamId)),
    db.select().from(pendingApprovals).where(
      and(eq(pendingApprovals.teamId, teamId), eq(pendingApprovals.status, "pending"))
    ),
    db.select().from(transactions).where(eq(transactions.teamId, teamId))
      .orderBy(desc(transactions.timestamp)).limit(30),
    db.select().from(teamsState),
  ]);

  const myTeam = teamRows[0];
  if (!myTeam) return null;

  const propertiesRecord: Record<string, PropertyState> = {};
  for (const p of properties) propertiesRecord[p.propertyId] = p as PropertyState;

  const leaderboard = allTeams.map((t) => {
    const propValue = ((t.ownedProperties as string[]) ?? [])
      .reduce((sum, pid) => sum + (propertiesRecord[pid]?.price ?? 0), 0);
    return { teamId: t.teamId, displayName: t.displayName, balance: t.balance, netWorth: t.balance + propValue };
  }).sort((a, b) => b.netWorth - a.netWorth);

  let pushDetail = null;
  const myPush = pushRows[0];
  if (myPush) {
    const prop = propertiesRecord[myPush.propertyId];
    const task = myPush.taskId ? TASKS.find((t) => t.taskId === myPush.taskId) ?? null : null;
    pushDetail = { property: prop, task, pushedAt: myPush.pushedAt };
  }

  return {
    team: { ...myTeam, ownedProperties: (myTeam.ownedProperties as string[]) ?? [] },
    push: pushDetail,
    pendingApprovals: myPending as PendingApproval[],
    transactions: myTx as Transaction[],
    leaderboard,
    properties: propertiesRecord,
  };
}

// ─── Admin: Push property ─────────────────────────────────────────────────────

export async function pushProperty(teamId: string, propertyId: string): Promise<{ ok: boolean; error?: string }> {
  const team = await db.select().from(teamsState).where(eq(teamsState.teamId, teamId)).limit(1);
  const prop = await db.select().from(propertiesState).where(eq(propertiesState.propertyId, propertyId)).limit(1);
  if (!team[0]) return { ok: false, error: "Team not found" };
  if (!prop[0]) return { ok: false, error: "Property not found" };

  const taskId = prop[0].status === "vacant" ? await pickTask() : null;

  await db.insert(currentPush).values({ teamId, propertyId, taskId, pushedAt: Date.now() })
    .onConflictDoUpdate({ target: currentPush.teamId, set: { propertyId, taskId, pushedAt: Date.now() } });
  return { ok: true };
}

// ─── Admin: Clear push ────────────────────────────────────────────────────────

export async function clearPush(teamId: string): Promise<void> {
  await db.delete(currentPush).where(eq(currentPush.teamId, teamId));
}

// ─── Player: Submit request ───────────────────────────────────────────────────

export async function submitRequest(
  teamId: string, type: ApprovalType, propertyId: string, taskId?: number
): Promise<{ ok: boolean; error?: string; id?: string }> {
  const [teamRows, propRows] = await Promise.all([
    db.select().from(teamsState).where(eq(teamsState.teamId, teamId)).limit(1),
    db.select().from(propertiesState).where(eq(propertiesState.propertyId, propertyId)).limit(1),
  ]);
  const team = teamRows[0]; const prop = propRows[0];
  if (!team || !prop) return { ok: false, error: "Invalid team or property" };

  const dupe = await db.select().from(pendingApprovals).where(
    and(eq(pendingApprovals.teamId, teamId), eq(pendingApprovals.propertyId, propertyId),
      eq(pendingApprovals.type, type), eq(pendingApprovals.status, "pending"))
  ).limit(1);
  if (dupe[0]) return { ok: false, error: "Request already pending" };

  let amount = 0;
  if (type === "buy") {
    amount = prop.price;
    if (team.balance < prop.price) return { ok: false, error: "Insufficient balance" };
    if (prop.status !== "vacant") return { ok: false, error: "Property not available" };
  } else if (type === "rent") {
    amount = prop.rent;
    if (team.balance < prop.rent) return { ok: false, error: "Insufficient balance" };
    if (prop.owner === teamId) return { ok: false, error: "You own this property" };
    if (!prop.owner) return { ok: false, error: "Property has no owner" };
  }

  const id = uid();
  await db.insert(pendingApprovals).values({
    id, type, teamId, propertyId, taskId: taskId ?? null,
    amount, status: "pending", timestamp: Date.now(),
  });
  return { ok: true, id };
}

// ─── Admin: Process approval ──────────────────────────────────────────────────

export async function processApproval(
  approvalId: string, decision: "approve" | "reject"
): Promise<{ ok: boolean; error?: string }> {
  const rows = await db.select().from(pendingApprovals).where(eq(pendingApprovals.id, approvalId)).limit(1);
  const a = rows[0];
  if (!a) return { ok: false, error: "Approval not found" };
  if (a.status !== "pending") return { ok: false, error: "Already processed" };

  const newStatus = decision === "approve" ? "approved" : "rejected";
  await db.update(pendingApprovals).set({ status: newStatus }).where(eq(pendingApprovals.id, approvalId));

  if (decision !== "approve") return { ok: true };

  const [teamRows, propRows] = await Promise.all([
    db.select().from(teamsState).where(eq(teamsState.teamId, a.teamId)).limit(1),
    db.select().from(propertiesState).where(eq(propertiesState.propertyId, a.propertyId)).limit(1),
  ]);
  const team = teamRows[0]; const prop = propRows[0];
  if (!team || !prop) return { ok: false, error: "State inconsistency" };

  const txId = uid();
  const now = Date.now();

  if (a.type === "task") {
    if (a.taskId != null) {
      const usageRow = await db.select().from(taskUsage).where(eq(taskUsage.taskId, a.taskId)).limit(1);
      await db.update(taskUsage).set({ uses: (usageRow[0]?.uses ?? 0) + 1 }).where(eq(taskUsage.taskId, a.taskId));
    }
    const newOwned = [...((team.ownedProperties as string[]) ?? []), a.propertyId];
    await Promise.all([
      db.update(teamsState).set({ ownedProperties: newOwned }).where(eq(teamsState.teamId, a.teamId)),
      db.update(propertiesState).set({ owner: a.teamId, status: "owned" }).where(eq(propertiesState.propertyId, a.propertyId)),
      db.insert(transactions).values({ id: txId, type: "reward", teamId: a.teamId, amount: 0, propertyId: a.propertyId, description: `Task completed on ${prop.name} (Earned property)`, timestamp: now }),
    ]);

  } else if (a.type === "buy") {
    if (team.balance < a.amount) {
      await db.update(pendingApprovals).set({ status: "rejected" }).where(eq(pendingApprovals.id, approvalId));
      return { ok: false, error: "Insufficient balance at time of approval" };
    }
    const newOwned = [...((team.ownedProperties as string[]) ?? []), a.propertyId];
    await Promise.all([
      db.update(teamsState).set({ balance: team.balance - a.amount, ownedProperties: newOwned }).where(eq(teamsState.teamId, a.teamId)),
      db.update(propertiesState).set({ owner: a.teamId, status: "owned" }).where(eq(propertiesState.propertyId, a.propertyId)),
      db.insert(transactions).values({ id: txId, type: "purchase", teamId: a.teamId, amount: -a.amount, propertyId: a.propertyId, description: `Bought ${prop.name}`, timestamp: now }),
    ]);

  } else if (a.type === "rent") {
    if (team.balance < a.amount) {
      await db.update(pendingApprovals).set({ status: "rejected" }).where(eq(pendingApprovals.id, approvalId));
      return { ok: false, error: "Insufficient balance at time of approval" };
    }
    if (!prop.owner) return { ok: false, error: "No owner to pay" };
    const ownerRows = await db.select().from(teamsState).where(eq(teamsState.teamId, prop.owner)).limit(1);
    const owner = ownerRows[0];
    if (!owner) return { ok: false, error: "Owner not found" };
    await Promise.all([
      db.update(teamsState).set({ balance: team.balance - a.amount }).where(eq(teamsState.teamId, a.teamId)),
      db.update(teamsState).set({ balance: owner.balance + a.amount }).where(eq(teamsState.teamId, prop.owner)),
      db.insert(transactions).values({ id: txId, type: "rent", teamId: a.teamId, amount: -a.amount, propertyId: a.propertyId, description: `Paid rent on ${prop.name}`, timestamp: now }),
      db.insert(transactions).values({ id: uid(), type: "rent", teamId: prop.owner, amount: a.amount, propertyId: a.propertyId, description: `Received rent from ${team.displayName} on ${prop.name}`, timestamp: now }),
    ]);
  }

  return { ok: true };
}

// ─── Admin: Edit balance ──────────────────────────────────────────────────────

export async function editBalance(teamId: string, delta: number, reason: string): Promise<{ ok: boolean; error?: string }> {
  const rows = await db.select().from(teamsState).where(eq(teamsState.teamId, teamId)).limit(1);
  const team = rows[0];
  if (!team) return { ok: false, error: "Team not found" };
  await Promise.all([
    db.update(teamsState).set({ balance: team.balance + delta }).where(eq(teamsState.teamId, teamId)),
    db.insert(transactions).values({ id: uid(), type: "manual", teamId, amount: delta, description: reason || "Manual adjustment", timestamp: Date.now() }),
  ]);
  return { ok: true };
}

// ─── Admin: Assign / remove property owner ────────────────────────────────────

export async function assignProperty(propertyId: string, teamId: string | null): Promise<{ ok: boolean; error?: string }> {
  const propRows = await db.select().from(propertiesState).where(eq(propertiesState.propertyId, propertyId)).limit(1);
  const prop = propRows[0];
  if (!prop) return { ok: false, error: "Property not found" };

  if (prop.owner) {
    const oldOwnerRows = await db.select().from(teamsState).where(eq(teamsState.teamId, prop.owner)).limit(1);
    const oldOwner = oldOwnerRows[0];
    if (oldOwner) {
      const updated = ((oldOwner.ownedProperties as string[]) ?? []).filter((id) => id !== propertyId);
      await db.update(teamsState).set({ ownedProperties: updated }).where(eq(teamsState.teamId, prop.owner));
    }
  }

  if (teamId) {
    const newOwnerRows = await db.select().from(teamsState).where(eq(teamsState.teamId, teamId)).limit(1);
    const newOwner = newOwnerRows[0];
    if (!newOwner) return { ok: false, error: "Team not found" };
    const updated = [...((newOwner.ownedProperties as string[]) ?? [])];
    if (!updated.includes(propertyId)) updated.push(propertyId);
    await Promise.all([
      db.update(teamsState).set({ ownedProperties: updated }).where(eq(teamsState.teamId, teamId)),
      db.update(propertiesState).set({ owner: teamId, status: "owned" }).where(eq(propertiesState.propertyId, propertyId)),
    ]);
  } else {
    await db.update(propertiesState).set({ owner: null, status: "vacant" }).where(eq(propertiesState.propertyId, propertyId));
  }
  return { ok: true };
}
