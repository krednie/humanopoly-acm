import {
  pgTable, pgEnum, text, integer, uuid,
  timestamp, index,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const propertyStatusEnum = pgEnum("property_status", ["vacant", "owned"]);
export const approvalTypeEnum = pgEnum("approval_type", ["buy", "rent", "task_money", "task_property"]);
export const approvalStatusEnum = pgEnum("approval_status", ["pending", "approved", "rejected"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["purchase", "rent", "reward", "manual"]);

// ─── Teams ────────────────────────────────────────────────────────────────────

export const teamsState = pgTable("teams_state", {
  teamId: text("team_id").primaryKey(),
  displayName: text("display_name").notNull(),
  balance: integer("balance").notNull().default(1500),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Properties ───────────────────────────────────────────────────────────────

export const propertiesState = pgTable("properties_state", {
  propertyId: text("property_id").primaryKey(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  rent: integer("rent").notNull(),
  owner: text("owner").references(() => teamsState.teamId),
  status: propertyStatusEnum("status").notNull().default("vacant"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_properties_owner").on(table.owner),
]);

// ─── Current Push ─────────────────────────────────────────────────────────────

export const currentPush = pgTable("current_push", {
  teamId: text("team_id").primaryKey().references(() => teamsState.teamId),
  propertyId: text("property_id").notNull().references(() => propertiesState.propertyId),
  taskId: integer("task_id"),
  pushedAt: timestamp("pushed_at").defaultNow().notNull(),
});

// ─── Pending Approvals ───────────────────────────────────────────────────────

export const pendingApprovals = pgTable("pending_approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: approvalTypeEnum("type").notNull(),
  teamId: text("team_id").notNull().references(() => teamsState.teamId),
  propertyId: text("property_id").notNull().references(() => propertiesState.propertyId),
  taskId: integer("task_id"),
  amount: integer("amount").notNull().default(0),
  status: approvalStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_approvals_team_status").on(table.teamId, table.status),
]);

// ─── Transactions ─────────────────────────────────────────────────────────────

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: transactionTypeEnum("type").notNull(),
  teamId: text("team_id").notNull().references(() => teamsState.teamId),
  amount: integer("amount").notNull(),
  propertyId: text("property_id").references(() => propertiesState.propertyId),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_transactions_team").on(table.teamId),
]);

// ─── Task Usage ───────────────────────────────────────────────────────────────

export const taskUsage = pgTable("task_usage", {
  taskId: integer("task_id").primaryKey(),
  uses: integer("uses").notNull().default(0),
});

// ─── Admin Assignments ────────────────────────────────────────────────────────

export const adminAssignments = pgTable("admin_assignments", {
  adminId: text("admin_id").primaryKey(),
  teamId: text("team_id").notNull().references(() => teamsState.teamId),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
});
