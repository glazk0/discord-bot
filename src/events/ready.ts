import { Events } from "discord.js";
import { logger } from "#config/logger";
import { defineEvent } from "#core/event";
import { database } from "#database/client";
import { guilds } from "#database/schema/guild";

export default defineEvent({
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    const shardId = client.shard?.ids[0] ?? 0;

    logger.info(
      { tag: client.user.tag, shardId, guildCount: client.guilds.cache.size },
      "Client ready",
    );

    const rows = client.guilds.cache.map((guild) => ({
      id: guild.id,
      locale: guild.preferredLocale,
    }));

    if (rows.length === 0) return;

    try {
      await database.insert(guilds).values(rows).onConflictDoNothing({ target: guilds.id });
      logger.debug({ shardId, synced: rows.length }, "Guild rows synced");
    } catch (error) {
      logger.error({ error, shardId }, "Guild row sync failed");
    }
  },
});
