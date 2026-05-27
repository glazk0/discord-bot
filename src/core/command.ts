import {
  ApplicationCommandType,
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
  type ContextMenuCommandBuilder,
  type MessageContextMenuCommandInteraction,
  type SlashCommandBuilder,
  type SlashCommandOptionsOnlyBuilder,
  type SlashCommandSubcommandsOnlyBuilder,
  type UserContextMenuCommandInteraction,
} from "discord.js";
import type { TFunction } from "i18next";
import type { FALLBACK_NS, Locale } from "#i18n/index";

export type AnySlashCommandBuilder =
  | SlashCommandBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandsOnlyBuilder;

export interface CommandContext {
  t: TFunction<["commands", typeof FALLBACK_NS]>;
  locale: Locale;
}

export interface SlashCommand {
  data: AnySlashCommandBuilder;
  execute(interaction: ChatInputCommandInteraction, ctx: CommandContext): Promise<void> | void;
  autocomplete?(interaction: AutocompleteInteraction, ctx: CommandContext): Promise<void> | void;
}

export interface UserContextMenuCommand {
  data: ContextMenuCommandBuilder;
  execute(
    interaction: UserContextMenuCommandInteraction,
    ctx: CommandContext,
  ): Promise<void> | void;
}

export interface MessageContextMenuCommand {
  data: ContextMenuCommandBuilder;
  execute(
    interaction: MessageContextMenuCommandInteraction,
    ctx: CommandContext,
  ): Promise<void> | void;
}

export type Command = SlashCommand | UserContextMenuCommand | MessageContextMenuCommand;

export function defineCommand(command: SlashCommand): SlashCommand {
  return command;
}

export function defineUserContextMenu(command: UserContextMenuCommand): UserContextMenuCommand {
  command.data.setType(ApplicationCommandType.User);
  return command;
}

export function defineMessageContextMenu(
  command: MessageContextMenuCommand,
): MessageContextMenuCommand {
  command.data.setType(ApplicationCommandType.Message);
  return command;
}
