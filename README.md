# discord-bot

[![License](https://img.shields.io/github/license/glazk0/discord-bot)](LICENSE)
[![CI](https://github.com/glazk0/discord-bot/actions/workflows/ci.yml/badge.svg)](https://github.com/glazk0/discord-bot/actions/workflows/ci.yml)

TypeScript boilerplate for [discord.js](https://discord.js.org/) bots. File-based loaders, Drizzle + Postgres, Redis cache, BullMQ jobs, croner schedules, i18n, sharding.

## Stack

| Concern         | Choice                            |
| --------------- | --------------------------------- |
| Runtime         | Node.js >= 22.18                  |
| Package manager | pnpm >= 10                        |
| Library         | discord.js 14                     |
| ORM             | Drizzle (Postgres, node-postgres) |
| Cache           | Redis (ioredis)                   |
| Jobs            | BullMQ                            |
| Cron            | croner (shard 0)                  |
| i18n            | i18next + fs backend              |
| Validation      | Zod                               |
| Logging         | Pino                              |
| Lint / format   | oxlint / oxfmt                    |

## Quickstart

```bash
git clone https://github.com/glazk0/discord-bot.git my-bot
cd my-bot
pnpm install

cp .env.example .env
# fill in DISCORD_TOKEN, DATABASE_URL, REDIS_URL

docker compose -f .docker/docker-compose.dev.yml up -d
pnpm db:migrate
pnpm dev
```

Run `/ping` in your test server to confirm it works.

## Project layout

```
src/
  cache/        Redis client + typed get/set/del
  commands/     Slash and context-menu commands
  components/   Buttons, modals, select-menus
  config/       env + logger
  core/         define* helpers and shared types
  cron/         Croner schedules (shard 0)
  database/     Drizzle client, schema, cache adapter
  events/       Discord gateway event handlers
  i18n/         i18next setup + locale resolution
  jobs/         BullMQ jobs + worker
  locales/      <locale>/<namespace>.json
  scripts/      One-shot scripts
  index.ts      ShardingManager entrypoint
  shard.ts      Per-shard bootstrap
drizzle/        Generated migrations
.docker/        Dockerfile + compose files
```

## Slash commands

```ts
import { SlashCommandBuilder } from "discord.js";
import { defineCommand } from "#core/command";
import { i18next } from "#i18n/index";
import { localizations } from "#i18n/translator";

export default defineCommand({
  data: new SlashCommandBuilder()
    .setName("hello")
    .setDescription(i18next.t("hello.description"))
    .setDescriptionLocalizations(localizations("hello.description")),

  async execute(interaction, { t }) {
    await interaction.reply(t("hello.reply"));
  },
});
```

Add the locale keys under `src/locales/<locale>/commands.json` and restart.

## Context menu commands

Right-click, Apps. Use `defineUserContextMenu` or `defineMessageContextMenu`; both auto-apply the correct `setType`. Names allow spaces and case (slash names do not). No description field (32-char name only).

```ts
import { ContextMenuCommandBuilder } from "discord.js";
import { defineUserContextMenu } from "#core/command";

export default defineUserContextMenu({
  data: new ContextMenuCommandBuilder().setName("User info"),

  async execute(interaction, { t }) {
    await interaction.reply(t("user_info.reply", { tag: interaction.targetUser.tag }));
  },
});
```

See `src/commands/context-menu/` for working examples.

## Components

Buttons, modals, and select-menus go in `src/components/{buttons,modals,select-menus}/`. The file's `customId` is matched as a prefix; segments separated by `:` are passed as `ctx.args`. Build them with `buildCustomId("prefix", "arg1", "arg2")`.

## Jobs

Durable, retryable, delayed work on Redis. Workers run inside every shard.

```ts
import { z } from "zod";
import { defineJob } from "#core/job";

export const sendReminder = defineJob({
  name: "reminder.send",
  schema: z.object({ userId: z.string(), guildId: z.string(), message: z.string() }),
  async execute({ userId, guildId, message }, { logger, client }) {
    logger.info({ userId, guildId, message }, "Sending reminder");
    // client is the live discord.js Client.
  },
});
```

Dispatch:

```ts
import { sendReminder } from "#jobs/example";

await sendReminder.dispatch(
  { userId: "123", guildId: "456", message: "hi" },
  { delay: 60_000, attempts: 3, backoff: { type: "exponential", delay: 1_000 } },
);
```

Full `JobsOptions` is forwarded to BullMQ (see [docs](https://docs.bullmq.io/guide/jobs/job-options)). Worker concurrency via `WORKER_CONCURRENCY` (default 10).

A worker on shard N can only see shard N's caches. For cross-shard reach use `client.shard?.broadcastEval(...)` or the REST API.

## Cron

Periodic in-process work. Runs only on shard 0 to avoid duplicate ticks. For durable schedules, dispatch a job from inside the handler.

```ts
import { defineCron } from "#core/cron";

export default defineCron({
  name: "guild-count",
  pattern: "*/5 * * * *",
  async execute({ logger, client }) {
    const counts = (await client.shard?.broadcastEval((c) => c.guilds.cache.size)) ?? [
      client.guilds.cache.size,
    ];
    logger.info({ total: counts.reduce((a, b) => a + b, 0) }, "guild-count");
  },
});
```

Standard 5-field cron (`min hour dom month dow`). Overrun protection is on by default.

## Cache

Drizzle queries opt in to caching with `.$withCache()`:

```ts
await db
  .select()
  .from(guilds)
  .where(eq(guilds.id, id))
  .limit(1)
  .$withCache({ config: { ex: 3600 } });
```

Default TTL is 60s if no config is passed. `insert`/`update`/`delete` through Drizzle auto-invalidates every cached SELECT that touched the same table. For finer control use `.$withCache({ tag: "..." })` + `db.$cache.invalidate({ tags: "..." })`. Relational queries (`db.query.*`), transactions, and raw SQL are not cached (Drizzle limitation).

The same Redis instance is also exposed as `cache.get/set/del` for non-DB caching (external API responses, etc.).

## Locales

Add `src/locales/<locale>/` mirroring `en-US/`. Auto-discovered on boot.

## Tables

1. Schema file under `src/database/schema/`, re-export from `index.ts`.
2. `pnpm db:generate --name <change>`.
3. `pnpm db:migrate`.

## Scripts

| Command                        | What it does                                  |
| ------------------------------ | --------------------------------------------- |
| `pnpm dev`                     | tsx watch on `src/index.ts`                   |
| `pnpm build`                   | Compile to `dist/`                            |
| `pnpm start`                   | Run the built bot                             |
| `pnpm typecheck`               | `tsc --noEmit`                                |
| `pnpm lint` / `lint:fix`       | oxlint                                        |
| `pnpm format` / `format:check` | oxfmt                                         |
| `pnpm db:generate`             | Generate a Drizzle migration                  |
| `pnpm db:migrate`              | Apply pending migrations                      |
| `pnpm db:studio`               | Open Drizzle Studio                           |
| `pnpm commands:deploy`         | Push the registered slash commands to Discord |

## Contributing

PRs welcome. Run `pnpm typecheck && pnpm lint && pnpm format:check` before pushing.

## License

[MIT](LICENSE).
