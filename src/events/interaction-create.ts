import {
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
  Events,
  MessageFlags,
  type MessageContextMenuCommandInteraction,
  type RepliableInteraction,
  type UserContextMenuCommandInteraction,
} from "discord.js";

import { getMessageContextMenu, getSlashCommand, getUserContextMenu } from "#commands/index";
import { getButton, getModal, getSelectMenu } from "#components/index";
import { logger } from "#config/logger";
import type { CommandContext } from "#core/command";
import { type ComponentInteraction, type ComponentLookup, parseCustomId } from "#core/component";
import { defineEvent } from "#core/event";
import { resolveLocale } from "#i18n/resolve";
import { translator } from "#i18n/translator";

type ApplicationCommandInteraction =
  | ChatInputCommandInteraction
  | UserContextMenuCommandInteraction
  | MessageContextMenuCommandInteraction;

export default defineEvent({
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      await handleSlashCommand(interaction);
      return;
    }

    if (interaction.isUserContextMenuCommand()) {
      await handleUserContextMenu(interaction);
      return;
    }

    if (interaction.isMessageContextMenuCommand()) {
      await handleMessageContextMenu(interaction);
      return;
    }

    if (interaction.isAutocomplete()) {
      await handleAutocomplete(interaction);
      return;
    }

    if (interaction.isButton()) {
      await handleComponent(interaction, getButton, "button");
      return;
    }

    if (interaction.isModalSubmit()) {
      await handleComponent(interaction, getModal, "modal");
      return;
    }

    if (interaction.isAnySelectMenu()) {
      await handleComponent(interaction, getSelectMenu, "select-menu");
      return;
    }
  },
});

async function handleSlashCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const command = getSlashCommand(interaction.commandName);

  if (!command) {
    logger.warn(
      { commandName: interaction.commandName, kind: "slash" },
      "Unhandled command interaction",
    );
    return;
  }

  await runCommand(interaction, "slash", (ctx) => command.execute(interaction, ctx));
}

async function handleUserContextMenu(
  interaction: UserContextMenuCommandInteraction,
): Promise<void> {
  const command = getUserContextMenu(interaction.commandName);

  if (!command) {
    logger.warn(
      { commandName: interaction.commandName, kind: "user-context-menu" },
      "Unhandled command interaction",
    );
    return;
  }

  await runCommand(interaction, "user-context-menu", (ctx) => command.execute(interaction, ctx));
}

async function handleMessageContextMenu(
  interaction: MessageContextMenuCommandInteraction,
): Promise<void> {
  const command = getMessageContextMenu(interaction.commandName);

  if (!command) {
    logger.warn(
      { commandName: interaction.commandName, kind: "message-context-menu" },
      "Unhandled command interaction",
    );
    return;
  }

  await runCommand(interaction, "message-context-menu", (ctx) => command.execute(interaction, ctx));
}

async function handleAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
  const command = getSlashCommand(interaction.commandName);

  if (!command) {
    logger.warn(
      { commandName: interaction.commandName, kind: "autocomplete" },
      "Unhandled command interaction",
    );
    return;
  }
  if (!command.autocomplete) return;

  const locale = await resolveLocale(interaction);
  const t = translator(locale);

  try {
    await command.autocomplete(interaction, { t, locale });
  } catch (error) {
    logger.error({ error, commandName: interaction.commandName }, "Autocomplete execution failed");
  }
}

async function handleComponent<I extends ComponentInteraction>(
  interaction: I,
  lookup: ComponentLookup<I>,
  kind: string,
): Promise<void> {
  const { prefix, args } = parseCustomId(interaction.customId);
  const handler = lookup(prefix);

  if (!handler) {
    logger.warn({ kind, customId: interaction.customId }, "Unhandled component interaction");
    return;
  }

  const locale = await resolveLocale(interaction);
  const t = translator(locale);

  try {
    await handler.execute(interaction, { t, locale, args });
  } catch (error) {
    logger.error({ error, kind, customId: interaction.customId }, "Component execution failed");
    await replyError(interaction, t("errors.command_failed"));
  }
}

async function runCommand(
  interaction: ApplicationCommandInteraction,
  kind: string,
  run: (ctx: CommandContext) => Promise<void> | void,
): Promise<void> {
  const locale = await resolveLocale(interaction);
  const t = translator(locale);

  try {
    await run({ t, locale });
  } catch (error) {
    logger.error({ error, kind, commandName: interaction.commandName }, "Command execution failed");
    await replyError(interaction, t("errors.command_failed"));
  }
}

async function replyError(interaction: RepliableInteraction, content: string): Promise<void> {
  const payload = { content, flags: MessageFlags.Ephemeral } as const;
  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(payload);
    } else {
      await interaction.reply(payload);
    }
  } catch (error) {
    logger.error({ error }, "Failed to send error reply");
  }
}
