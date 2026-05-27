import { env } from "#config/env";
import { logger } from "#config/logger";
import type { Job, JobContext } from "#core/job";
import { type Job as BullJob, Queue, Worker } from "bullmq";
import type { Client } from "discord.js";
import { glob } from "glob";
import { Redis } from "ioredis";
import { parse } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const JOBS_DIR = fileURLToPath(new URL("./**/*.{js,ts}", import.meta.url));

const QUEUE_NAME = "jobs";

type RegisteredJob = Job<unknown>;

const registry = new Map<string, RegisteredJob>();

let queueConnection: Redis | null = null;
let workerConnection: Redis | null = null;
let queue: Queue | null = null;
let worker: Worker | null = null;

function createConnection(role: "queue" | "worker"): Redis {
  const connection = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times) => Math.min(times * 200, 5_000),
  });
  connection.on("error", (err) => logger.error({ err, role }, "BullMQ Redis error"));
  return connection;
}

function isJobLike(value: unknown): value is RegisteredJob {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    typeof (value as { name: unknown }).name === "string" &&
    "execute" in value &&
    typeof (value as { execute: unknown }).execute === "function"
  );
}

export async function registerJobs(): Promise<void> {
  const entries = await glob(JOBS_DIR, {
    ignore: ["**/index.{js,ts}"],
  });

  const modules = await Promise.all(
    entries.map(async (entry) => {
      const imported = (await import(pathToFileURL(entry).href)) as Record<string, unknown>;
      const jobs = Object.values(imported).filter(isJobLike);
      if (jobs.length === 0) {
        throw new Error(`Job file "${parse(entry).base}" exports no jobs`);
      }
      return jobs;
    }),
  );

  for (const jobs of modules) {
    for (const job of jobs) {
      if (registry.has(job.name)) {
        logger.warn({ name: job.name }, "Duplicate job name; ignoring");
        continue;
      }
      registry.set(job.name, job);
    }
  }

  logger.debug({ jobs: registry.size }, "Jobs registered");
}

export async function startWorker(client: Client): Promise<void> {
  if (worker) return;

  queueConnection = createConnection("queue");
  workerConnection = createConnection("worker");

  queue = new Queue(QUEUE_NAME, {
    connection: queueConnection,
    defaultJobOptions: {
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    },
  });

  worker = new Worker(
    QUEUE_NAME,
    async (job: BullJob) => {
      const definition = registry.get(job.name);

      if (!definition) {
        throw new Error(`No handler registered for job "${job.name}"`);
      }

      const payload = definition.schema ? definition.schema.parse(job.data) : job.data;

      const ctx: JobContext = {
        logger: logger.child({ jobId: job.id, jobName: job.name }),
        client,
      };

      await definition.execute(payload, ctx);
    },
    {
      connection: workerConnection,
      concurrency: env.WORKER_CONCURRENCY,
    },
  );

  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, jobName: job?.name, err }, "Job failed");
  });
  worker.on("error", (err) => {
    logger.error({ err }, "Worker error");
  });

  await worker.waitUntilReady();

  logger.debug({ concurrency: env.WORKER_CONCURRENCY }, "Worker ready");
}

export async function closeWorker(): Promise<void> {
  await worker?.close();
  await workerConnection?.quit();
  worker = null;
  workerConnection = null;
}

export async function closeQueue(): Promise<void> {
  await queue?.close();
  await queueConnection?.quit();
  queue = null;
  queueConnection = null;
}

export function getQueue(): Queue {
  if (!queue) {
    throw new Error("Queue not initialized; startWorker() must be called first");
  }
  return queue;
}
