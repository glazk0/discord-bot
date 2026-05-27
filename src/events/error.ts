import { Events } from "discord.js";
import { logger } from "#config/logger";
import { defineEvent } from "#core/event";

export default defineEvent({
  name: Events.Error,
  execute(error) {
    logger.error({ error }, "Error occurred");
  },
});
