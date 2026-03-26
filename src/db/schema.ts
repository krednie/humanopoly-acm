import { pgTable, text, integer, jsonb } from "drizzle-orm/pg-core";

export const teamsState = pgTable("teams_state", {
  teamId: text("team_id").primaryKey(),
  displayName: text("display_name").notNull(),
  balance: integer("balance").notNull().default(1500),
  ownedProperties: jsonb("owned_properties").$type<string[]>().notNull().default([]),
});

export const propertiesState = pgTable("properties_state", {
  propertyId: text("property_id").primaryKey(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  rent: integer("rent").notNull(),
  owner: text("owner"),
  status: text("status").notNull().default("vacant"),
});

export const currentPush = pgTable("current_push", {
  teamId: text("team_id").primaryKey(),
  propertyId: text("property_id").notNull(),
  taskId: integer("task_id"),
  pushedAt: integer("pushed_at").notNull(),
});

export const pendingApprovals = pgTable("pending_approvals", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  teamId: text("team_id").notNull(),
  propertyId: text("property_id").notNull(),
  taskId: integer("task_id"),
  amount: integer("amount").notNull().default(0),
  status: text("status").notNull().default("pending"),
  timestamp: integer("timestamp").notNull(),
});

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  teamId: text("team_id").notNull(),
  amount: integer("amount").notNull(),
  propertyId: text("property_id"),
  description: text("description").notNull(),
  timestamp: integer("timestamp").notNull(),
});

export const taskUsage = pgTable("task_usage", {
  taskId: integer("task_id").primaryKey(),
  uses: integer("uses").notNull().default(0),
});
