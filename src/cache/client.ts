import { Redis } from "ioredis";
import { env } from "#config/env";
import { logger } from "#config/logger";

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy: (times) => Math.min(times * 200, 5_000),
});

redis.on("error", (err) => logger.error({ err }, "Redis error"));
redis.on("connect", () => logger.debug("Redis connecting"));
redis.on("ready", () => logger.info("Redis ready"));

export async function closeRedis(): Promise<void> {
  if (redis.status === "ready" || redis.status === "connecting") {
    await redis.quit();
  }
}
