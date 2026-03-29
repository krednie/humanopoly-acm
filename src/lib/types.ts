// ─── Shared game types ────────────────────────────────────────────────────────
// Single source of truth — imported by gameState.ts, admin/page.tsx, player/page.tsx

export type PropertyStatus = "vacant" | "owned";
export type ApprovalType = "task_money" | "task_property" | "buy" | "rent";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type TransactionType = "purchase" | "rent" | "reward" | "manual";

export interface PropertyState {
  propertyId: string;
  name: string;
  price: number;
  rent: number;
  owner: string | null;
  status: PropertyStatus;
}

export interface TeamState {
  teamId: string;
  displayName: string;
  balance: number;
}

export interface CurrentPush {
  propertyId: string;
  taskId: number | null;
  pushedAt: string;
}

export interface PendingApproval {
  id: string;
  type: ApprovalType;
  teamId: string;
  propertyId: string;
  taskId?: number | null;
  amount: number;
  createdAt: string;
  status: ApprovalStatus;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  teamId: string;
  amount: number;
  propertyId?: string | null;
  description: string;
  createdAt: string;
}

export interface Task {
  taskId: number;
  name: string;
  reward: number;
}
