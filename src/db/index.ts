/**
 * DB Client — environment-aware
 *
 * Local dev  → @neondatabase/serverless WebSocket Pool (Node.js compatible)
 * Production → @neondatabase/serverless HTTP/fetch driver (Vercel serverless)
 *
 * Both use drizzle-orm under the hood so the query API is identical.
 */

import * as schema from "./schema";

const isDev = process.env.NODE_ENV === "development";

function buildDb() {
  if (isDev) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pool, neonConfig } = require("@neondatabase/serverless");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { drizzle } = require("drizzle-orm/neon-serverless");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    neonConfig.webSocketConstructor = require("ws");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
    return drizzle({ client: pool, schema });
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { neon } = require("@neondatabase/serverless");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { drizzle } = require("drizzle-orm/neon-http");
    const sql = neon(process.env.DATABASE_URL!);
    return drizzle({ client: sql, schema });
  }
}

// Singleton — only built once per server process
export const db: ReturnType<typeof import("drizzle-orm/neon-http").drizzle> = buildDb();
