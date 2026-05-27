import { env } from "#config/env";
import { logger } from "#config/logger";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

export async function migrateDatabase(): Promise<void> {
  const migrationsFolder = fileURLToPath(new URL("../../drizzle", import.meta.url));

  logger.info({ migrationsFolder }, "Running migrations");

  const pool = new Pool({ connectionString: env.DATABASE_URL, max: 1 });

  try {
    await migrate(drizzle(pool), { migrationsFolder });
    logger.info("Migrations applied");
  } finally {
    await pool.end();
  }
}
