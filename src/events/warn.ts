import { Events } from "discord.js";
import { logger } from "#config/logger";
import { defineEvent } from "#core/event";

export default defineEvent({
  name: Events.Warn,
  execute(message) {
    logger.warn({ message }, "Warning encountered");
  },
});
