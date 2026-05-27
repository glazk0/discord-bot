import { closeRedis, redis } from "#cache/client";
import { deployCommands, registerCommands } from "#commands/index";
import { registerComponents } from "#components/index";
import { env } from "#config/env";
import { logger } from "#config/logger";
import { createClient } from "#core/client";
import { registerCron, startCron, stopCron } from "#cron/index";
import { closeDatabase } from "#database/client";
import { registerEvents } from "#events/index";
import { initI18n } from "#i18n/index";
import { closeQueue, closeWorker, registerJobs, startWorker } from "#jobs/index";

async function main(): Promise<void> {
  logger.info("Shard starting");

  await redis.connect();

  await initI18n();

  const client = createClient();

  await Promise.all([
    registerCommands(),
    registerComponents(),
    registerJobs(),
    registerEvents(client),
  ]);

  logger.debug("Logging in to Discord");
  await client.login(env.DISCORD_TOKEN);

  await startWorker(client);

  const shardId = client.shard?.ids[0] ?? 0;

  if (shardId === 0) {
    await deployCommands(client);
    await registerCron();
    startCron(client);
  }

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal, shardId }, "Shutting down shard");
    try {
      client.destroy();
      stopCron();
      await closeWorker();
      await closeQueue();
      await closeRedis();
      await closeDatabase();
    } catch (error) {
      logger.error({ error }, "Error during shutdown");
    } finally {
      process.exit(0);
    }
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

await main();
