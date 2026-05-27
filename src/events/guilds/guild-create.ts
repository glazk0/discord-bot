import { Events } from "discord.js";
import { logger } from "#config/logger";
import { defineEvent } from "#core/event";
import { database } from "#database/client";
import { guilds } from "#database/schema/guild";

export default defineEvent({
  name: Events.GuildCreate,
  async execute(guild) {
    if (!guild.available) return;

    logger.info(
      { guildId: guild.id, name: guild.name, memberCount: guild.memberCount },
      "Joined guild",
    );

    try {
      await database
        .insert(guilds)
        .values({ id: guild.id, locale: guild.preferredLocale })
        .onConflictDoNothing({ target: guilds.id });
    } catch (error) {
      logger.error({ error, guildId: guild.id }, "Error while inserting guild in database");
    }
  },
});
