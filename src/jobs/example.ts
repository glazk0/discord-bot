import { z } from "zod";
import { defineJob } from "#core/job";

/**
 * Example dispatchable job. Demonstrates the same-shard fast path and the
 * cross-shard `broadcastEval` pattern for when the target guild lives on a
 * different shard than the worker that picked up the job.
 *
 * Dispatch from anywhere:
 *
 *   import { sendReminder } from "#jobs/example";
 *   await sendReminder.dispatch({ userId, guildId, message }, { delay: 60_000 });
 */
export const sendReminder = defineJob({
  name: "reminder.send",
  schema: z.object({
    userId: z.string(),
    guildId: z.string(),
    message: z.string(),
  }),
  async execute({ userId, guildId, message }, { logger, client }) {
    const local = client.guilds.cache.get(guildId);
    if (local) {
      logger.info({ userId, guildId, message }, "Sending reminder (local shard)");
      return;
    }

    const names = await client.shard?.broadcastEval(
      (c, { id }) => c.guilds.cache.get(id)?.name ?? null,
      { context: { id: guildId } },
    );

    logger.info({ userId, guildId, message, names }, "Sending reminder (cross-shard)");
  },
});
