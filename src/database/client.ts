import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { redis } from "#cache/client";
import { env } from "#config/env";
import { IoredisCache } from "./cache.ts";
import * as schema from "./schema/index.ts";

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
});

export const database = drizzle({
  client: pool,
  schema,
  casing: "snake_case",
  logger: env.NODE_ENV !== "production",
  cache: new IoredisCache(redis),
});

export type Database = typeof database;

export async function closeDatabase(): Promise<void> {
  await pool.end();
}
