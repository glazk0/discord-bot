import { defineCron } from "#core/cron";

/**
 * Example cron. Runs only on shard 0; uses `broadcastEval` to aggregate state
 * across every shard.
 *
 * If you need durable, retryable periodic work, dispatch a BullMQ job from
 * inside `execute` instead of doing the work here.
 */
export default defineCron({
  name: "guild-count",
  pattern: "*/5 * * * *",
  async execute({ logger, client }) {
    const counts = (await client.shard?.broadcastEval((c) => c.guilds.cache.size)) ?? [
      client.guilds.cache.size,
    ];
    const total = counts.reduce((a, b) => a + b, 0);
    logger.info({ total, perShard: counts }, "guild-count");
  },
});
