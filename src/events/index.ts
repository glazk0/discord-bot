import type { Client, ClientEvents } from "discord.js";
import { glob } from "glob";
import { parse } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { logger } from "#config/logger";
import type { Event } from "#core/event";

const EVENTS_DIR = fileURLToPath(new URL("./**/*.{js,ts}", import.meta.url));

export async function registerEvents(client: Client): Promise<void> {
  const entries = await glob(EVENTS_DIR, {
    ignore: ["**/index.{js,ts}"],
  });

  const events = await Promise.all(
    entries.map(async (entry) => {
      const imported = (await import(pathToFileURL(entry).href)) as {
        default?: Event;
      };
      if (!imported.default) {
        throw new Error(`Event file "${parse(entry).base}" has no default export`);
      }
      return imported.default;
    }),
  );

  for (const event of events) {
    attach(client, event);
  }

  logger.debug({ events: events.length }, "Events registered");
}

function attach(client: Client, event: Event): void {
  const listener = async (...args: ClientEvents[keyof ClientEvents]): Promise<void> => {
    try {
      await (event.execute as (...a: ClientEvents[keyof ClientEvents]) => Promise<void> | void)(
        ...args,
      );
    } catch (error) {
      logger.error({ error, event: event.name }, "Event handler threw");
    }
  };
  if (event.once) {
    client.once(event.name, listener);
  } else {
    client.on(event.name, listener);
  }
}
