import { Cron } from "croner";
import type { Client } from "discord.js";
import { glob } from "glob";
import { parse } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { logger } from "#config/logger";
import type { CronJob } from "#core/cron";

const CRON_DIR = fileURLToPath(new URL("./**/*.{js,ts}", import.meta.url));

const registry = new Map<string, CronJob>();
const runners: Cron[] = [];

export async function registerCron(): Promise<void> {
  const entries = await glob(CRON_DIR, {
    ignore: ["**/index.{js,ts}"],
  });

  const crons = await Promise.all(
    entries.map(async (entry) => {
      const imported = (await import(pathToFileURL(entry).href)) as {
        default?: CronJob;
      };
      if (!imported.default) {
        throw new Error(`Cron file "${parse(entry).base}" has no default export`);
      }
      return imported.default;
    }),
  );

  for (const cron of crons) {
    if (registry.has(cron.name)) {
      logger.warn({ name: cron.name }, "Duplicate cron name; ignoring");
      continue;
    }
    registry.set(cron.name, cron);
  }

  logger.debug({ crons: registry.size }, "Cron jobs registered");
}

export function startCron(client: Client): void {
  for (const cron of registry.values()) {
    const childLogger = logger.child({ cronName: cron.name });
    const runner = new Cron(
      cron.pattern,
      {
        name: cron.name,
        protect: true,
        catch: (err) => childLogger.error({ err }, "Cron handler threw"),
      },
      async () => {
        await cron.execute({ logger: childLogger, client });
      },
    );
    runners.push(runner);
  }

  logger.debug({ crons: runners.length }, "Cron jobs started");
}

export function stopCron(): void {
  for (const runner of runners) {
    runner.stop();
  }
  runners.length = 0;
}
