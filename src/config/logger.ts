import { pino, type Logger } from "pino";

import { env } from "./env.ts";

const isProd = env.NODE_ENV === "production";

export const logger: Logger = pino({
  level: env.LOG_LEVEL,
  base: { shardId: process.env["SHARD_ID"] ?? null, pid: process.pid },
  ...(isProd
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:HH:MM:ss.l",
            ignore: "pid,hostname",
          },
        },
      }),
});
