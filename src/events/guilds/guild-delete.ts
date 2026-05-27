import { Events } from "discord.js";
import { eq } from "drizzle-orm";
import { logger } from "#config/logger";
import { defineEvent } from "#core/event";
import { database } from "#database/client";
import { guilds } from "#database/schema/guild";

export default defineEvent({
  name: Events.GuildDelete,
  async execute(guild) {
    if (!guild.available) return;

    logger.info({ guildId: guild.id, name: guild.name }, "Left guild");

    try {
      await database.delete(guilds).where(eq(guilds.id, guild.id));
    } catch (error) {
      logger.error({ error, guildId: guild.id }, "Error while deleting guild from database");
    }
  },
});
