import { env } from "#config/env";
import { logger } from "#config/logger";
import { migrateDatabase } from "#database/migrate";
import { ShardingManager } from "discord.js";
import { fileURLToPath } from "node:url";

const isProduction = env.NODE_ENV === "production";

await migrateDatabase();

const file = fileURLToPath(new URL(isProduction ? "./shard.js" : "./shard.ts", import.meta.url));

const manager = new ShardingManager(file, {
  token: env.DISCORD_TOKEN,
  totalShards: "auto",
  mode: "process",
  respawn: true,
  execArgv: isProduction ? [] : ["--import", "tsx"],
});

manager.on("shardCreate", (shard) => {
  logger.info({ shardId: shard.id }, "Spawning shard");
  shard.on("death", () => logger.warn({ shardId: shard.id }, "Shard died"));
  shard.on("ready", () => logger.info({ shardId: shard.id }, "Shard ready"));
  shard.on("reconnecting", () => logger.warn({ shardId: shard.id }, "Shard reconnecting"));
});

const shutdown = (signal: string): void => {
  logger.info({ signal }, "Sharding manager shutting down");
  for (const shard of manager.shards.values()) shard.kill();
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

await manager.spawn();
