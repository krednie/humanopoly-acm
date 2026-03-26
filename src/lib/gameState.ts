/**
 * gameState.ts — In-memory singleton for the entire game.
 * Works perfectly with `npm run dev` (all devices on same WiFi).
 * For Vercel production, swap this with Supabase or Vercel KV.
 */

import { CREDENTIALS } from "./data/credentials";
import { PROPERTIES } from "./data/properties";
import { TASKS } from "./data/tasks";

// ─── Types ────────────────────────────────────────────────────────────────

export type PropertyStatus = "vacant" | "owned" | "locked";
export type ApprovalType = "task" | "buy" | "rent";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type TxType = "reward" | "purchase" | "rent" | "manual";

export interface PropertyState {
  propertyId: string;
  name: string;
  price: number;
  rent: number;
  owner: string | null; // teamId or null
  status: PropertyStatus;
}

export interface TeamState {
  teamId: string;
  displayName: string;
  balance: number;
  ownedProperties: string[]; // propertyIds
}

export interface CurrentPush {
  propertyId: string;
  taskId: number | null;
  pushedAt: number;
}

export interface PendingApproval {
  id: string;
  type: ApprovalType;
  teamId: string;
  propertyId: string;
  taskId?: number;
  amount: number;
  timestamp: number;
  status: ApprovalStatus;
  note?: string;
}

export interface Transaction {
  id: string;
  type: TxType;
  teamId: string;
  amount: number; // positive = gained, negative = lost
  propertyId?: string;
  description: string;
  timestamp: number;
}

export interface GameState {
  teams: Record<string, TeamState>;
  properties: Record<string, PropertyState>;
  currentPush: Record<string, CurrentPush | null>; // teamId → push
  pendingApprovals: PendingApproval[];
  transactions: Transaction[];
  taskUsage: Record<number, number>; // taskId → times used
}

// ─── Initialise ────────────────────────────────────────────────────────────

function initState(): GameState {
  const teams: Record<string, TeamState> = {};
  const currentPush: Record<string, CurrentPush | null> = {};

  for (const c of CREDENTIALS) {
    if (c.role === "player") {
      teams[c.teamId] = {
        teamId: c.teamId,
        displayName: c.displayName,
        balance: c.startingBalance,
        ownedProperties: [],
      };
      currentPush[c.teamId] = null;
    }
  }

  const properties: Record<string, PropertyState> = {};
  for (const p of PROPERTIES) {
    properties[p.propertyId] = {
      ...p,
      owner: null,
      status: "vacant",
    };
  }

  const taskUsage: Record<number, number> = {};
  for (const t of TASKS) {
    taskUsage[t.taskId] = 0;
  }

  return { teams, properties, currentPush, pendingApprovals: [], transactions: [], taskUsage };
}

// ─── Singleton (survives hot-reloads in dev via globalThis) ───────────────

declare global {
  // eslint-disable-next-line no-var
  var __gameState: GameState | undefined;
}

if (!globalThis.__gameState) {
  globalThis.__gameState = initState();
}

const state = globalThis.__gameState;

// ─── Helpers ───────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function pickTask(): number {
  // Pick the task with fewest uses (ties broken by lowest taskId)
  let minUses = Infinity;
  let picked = TASKS[0].taskId;
  for (const t of TASKS) {
    const used = state.taskUsage[t.taskId] ?? 0;
    if (used < minUses) {
      minUses = used;
      picked = t.taskId;
    }
  }
  return picked;
}

function addTx(tx: Omit<Transaction, "id" | "timestamp">) {
  state.transactions.unshift({ ...tx, id: uid(), timestamp: Date.now() });
}

// ─── Read ─────────────────────────────────────────────────────────────────

export function getState(): GameState {
  return state;
}

// ─── Admin: Push property to a team ───────────────────────────────────────

export function pushProperty(teamId: string, propertyId: string): { ok: boolean; error?: string } {
  const team = state.teams[teamId];
  const prop = state.properties[propertyId];
  if (!team) return { ok: false, error: "Team not found" };
  if (!prop) return { ok: false, error: "Property not found" };

  let taskId: number | null = null;
  if (prop.status === "vacant") {
    taskId = pickTask();
  }

  state.currentPush[teamId] = { propertyId, taskId, pushedAt: Date.now() };
  return { ok: true };
}

// ─── Admin: Clear push ────────────────────────────────────────────────────

export function clearPush(teamId: string) {
  state.currentPush[teamId] = null;
}

// ─── Player: Submit a request (queued for admin approval) ─────────────────

export function submitRequest(
  teamId: string,
  type: ApprovalType,
  propertyId: string,
  taskId?: number
): { ok: boolean; error?: string; id?: string } {
  const team = state.teams[teamId];
  const prop = state.properties[propertyId];
  if (!team || !prop) return { ok: false, error: "Invalid team or property" };

  // Prevent duplicate pending requests for same team+type+property
  const dupe = state.pendingApprovals.find(
    (a) => a.teamId === teamId && a.propertyId === propertyId && a.type === type && a.status === "pending"
  );
  if (dupe) return { ok: false, error: "Request already pending" };

  let amount = 0;
  if (type === "task") {
    const task = TASKS.find((t) => t.taskId === taskId);
    amount = task?.reward ?? 10;
  } else if (type === "buy") {
    amount = prop.price;
    if (team.balance < prop.price) return { ok: false, error: "Insufficient balance" };
    if (prop.status !== "vacant") return { ok: false, error: "Property not available" };
  } else if (type === "rent") {
    amount = prop.rent;
    if (team.balance < prop.rent) return { ok: false, error: "Insufficient balance" };
    if (prop.owner === teamId) return { ok: false, error: "You own this property" };
    if (!prop.owner) return { ok: false, error: "Property has no owner" };
  }

  const approval: PendingApproval = {
    id: uid(),
    type,
    teamId,
    propertyId,
    taskId,
    amount,
    timestamp: Date.now(),
    status: "pending",
  };
  state.pendingApprovals.unshift(approval);
  return { ok: true, id: approval.id };
}

// ─── Admin: Approve / Reject ──────────────────────────────────────────────

export function processApproval(
  approvalId: string,
  decision: "approve" | "reject"
): { ok: boolean; error?: string } {
  const a = state.pendingApprovals.find((x) => x.id === approvalId);
  if (!a) return { ok: false, error: "Approval not found" };
  if (a.status !== "pending") return { ok: false, error: "Already processed" };

  a.status = decision === "approve" ? "approved" : "rejected";

  if (decision !== "approve") return { ok: true };

  const team = state.teams[a.teamId];
  const prop = state.properties[a.propertyId];

  if (a.type === "task") {
    team.balance += a.amount;
    if (a.taskId !== undefined) state.taskUsage[a.taskId] = (state.taskUsage[a.taskId] ?? 0) + 1;
    addTx({ type: "reward", teamId: a.teamId, amount: a.amount, propertyId: a.propertyId, description: `Task reward on ${prop.name}` });

  } else if (a.type === "buy") {
    if (team.balance < a.amount) { a.status = "rejected"; return { ok: false, error: "Insufficient balance at time of approval" }; }
    team.balance -= a.amount;
    team.ownedProperties.push(a.propertyId);
    prop.owner = a.teamId;
    prop.status = "owned";
    addTx({ type: "purchase", teamId: a.teamId, amount: -a.amount, propertyId: a.propertyId, description: `Bought ${prop.name}` });

  } else if (a.type === "rent") {
    if (team.balance < a.amount) { a.status = "rejected"; return { ok: false, error: "Insufficient balance at time of approval" }; }
    if (!prop.owner) { a.status = "rejected"; return { ok: false, error: "No owner to pay" }; }
    team.balance -= a.amount;
    state.teams[prop.owner].balance += a.amount;
    addTx({ type: "rent", teamId: a.teamId, amount: -a.amount, propertyId: a.propertyId, description: `Paid rent on ${prop.name}` });
    addTx({ type: "rent", teamId: prop.owner, amount: a.amount, propertyId: a.propertyId, description: `Received rent from ${team.displayName} on ${prop.name}` });
  }

  return { ok: true };
}

// ─── Admin: Edit balance ───────────────────────────────────────────────────

export function editBalance(teamId: string, delta: number, reason: string): { ok: boolean; error?: string } {
  const team = state.teams[teamId];
  if (!team) return { ok: false, error: "Team not found" };
  team.balance += delta;
  addTx({ type: "manual", teamId, amount: delta, description: reason || "Manual adjustment" });
  return { ok: true };
}

// ─── Admin: Assign / remove property owner ────────────────────────────────

export function assignProperty(propertyId: string, teamId: string | null): { ok: boolean; error?: string } {
  const prop = state.properties[propertyId];
  if (!prop) return { ok: false, error: "Property not found" };

  // Remove from old owner
  if (prop.owner) {
    const oldTeam = state.teams[prop.owner];
    if (oldTeam) oldTeam.ownedProperties = oldTeam.ownedProperties.filter((id) => id !== propertyId);
  }

  if (teamId) {
    const newTeam = state.teams[teamId];
    if (!newTeam) return { ok: false, error: "Team not found" };
    prop.owner = teamId;
    prop.status = "owned";
    if (!newTeam.ownedProperties.includes(propertyId)) newTeam.ownedProperties.push(propertyId);
  } else {
    prop.owner = null;
    prop.status = "vacant";
  }

  return { ok: true };
}

// ─── Admin: Reset game ────────────────────────────────────────────────────

export function resetGame(): void {
  const fresh = initState();
  Object.assign(state, fresh);
}
