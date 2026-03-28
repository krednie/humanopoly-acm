// ─── Shared game types ────────────────────────────────────────────────────────
// Single source of truth — imported by gameState.ts, admin/page.tsx, player/page.tsx

export type PropertyStatus = "vacant" | "owned" | "locked";
export type ApprovalType = "task_money" | "task_property" | "buy" | "rent";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface PropertyState {
  propertyId: string;
  name: string;
  price: number;
  rent: number;
  owner: string | null;
  status: string;
}

export interface TeamState {
  teamId: string;
  displayName: string;
  balance: number;
  ownedProperties: string[];
}

export interface CurrentPush {
  propertyId: string;
  taskId: number | null;
  pushedAt: number;
}

export interface PendingApproval {
  id: string;
  type: string;
  teamId: string;
  propertyId: string;
  taskId?: number | null;
  amount: number;
  timestamp: number;
  status: string;
}

export interface Transaction {
  id: string;
  type: string;
  teamId: string;
  amount: number;
  propertyId?: string | null;
  description: string;
  timestamp: number;
}

export interface Task {
  taskId: number;
  name: string;
  reward: number;
}
