import { listCommands, registerCommands } from "#commands/index";
import { env } from "#config/env";
import { logger } from "#config/logger";
import { initI18n } from "#i18n/index";
import { REST, Routes } from "discord.js";

async function main(): Promise<void> {
  await initI18n();
  await registerCommands();

  const body = Array.from(listCommands(), (command) => command.data.toJSON());

  const rest = new REST().setToken(env.DISCORD_TOKEN);

  const application = (await rest.get(Routes.oauth2CurrentApplication())) as {
    id: string;
  };

  await rest.put(Routes.applicationCommands(application.id), { body });

  logger.info({ count: body.length }, "Commands deployed");
}

await main();
