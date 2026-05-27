import type { JobsOptions } from "bullmq";
import type { Client } from "discord.js";
import type { Logger } from "pino";
import type { z, ZodType } from "zod";
import { getQueue } from "#jobs/index";

export interface JobContext {
  logger: Logger;
  client: Client;
}

export interface JobDefinition<TPayload> {
  name: string;
  schema?: ZodType<TPayload>;
  execute(payload: TPayload, ctx: JobContext): Promise<void> | void;
}

export interface Job<TPayload> extends JobDefinition<TPayload> {
  dispatch(payload: TPayload, options?: JobsOptions): Promise<void>;
}

export function defineJob<TSchema extends ZodType>(def: {
  name: string;
  schema: TSchema;
  execute(payload: z.infer<TSchema>, ctx: JobContext): Promise<void> | void;
}): Job<z.infer<TSchema>>;
export function defineJob<TPayload>(def: {
  name: string;
  execute(payload: TPayload, ctx: JobContext): Promise<void> | void;
}): Job<TPayload>;
export function defineJob(def: JobDefinition<unknown>): Job<unknown> {
  return {
    ...def,
    async dispatch(payload: unknown, options?: JobsOptions): Promise<void> {
      await getQueue().add(def.name, payload, options);
    },
  };
}
