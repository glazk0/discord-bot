import type { Client } from "discord.js";
import type { Logger } from "pino";

export interface CronContext {
  logger: Logger;
  client: Client;
}

export interface CronJob {
  name: string;
  pattern: string;
  execute(ctx: CronContext): Promise<void> | void;
}

export function defineCron(cron: CronJob): CronJob {
  return cron;
}
