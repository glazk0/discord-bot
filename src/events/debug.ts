import { Events } from "discord.js";
import { logger } from "#config/logger";
import { defineEvent } from "#core/event";

export default defineEvent({
  name: Events.Debug,
  execute(message) {
    if (!message.match(/heartbeat/gi)) logger.debug({ message }, "Debug message");
  },
});
