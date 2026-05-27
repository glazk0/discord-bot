import { ApplicationCommandType, type Client, Collection } from "discord.js";
import { glob } from "glob";
import { parse } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { logger } from "#config/logger";
import type {
  Command,
  MessageContextMenuCommand,
  SlashCommand,
  UserContextMenuCommand,
} from "#core/command";

const COMMANDS_DIR = fileURLToPath(new URL("./**/*.{js,ts}", import.meta.url));

const slashCommands = new Collection<string, SlashCommand>();
const userContextMenuCommands = new Collection<string, UserContextMenuCommand>();
const messageContextMenuCommands = new Collection<string, MessageContextMenuCommand>();

export async function registerCommands(): Promise<void> {
  const entries = await glob(COMMANDS_DIR, {
    ignore: ["**/index.{js,ts}"],
  });

  const commands = await Promise.all(
    entries.map(async (entry) => {
      const imported = (await import(pathToFileURL(entry).href)) as {
        default?: Command;
      };
      if (!imported.default) {
        throw new Error(`Command file "${parse(entry).base}" has no default export`);
      }
      return imported.default;
    }),
  );

  for (const command of commands) {
    const name = command.data.name;
    const type = command.data.toJSON().type ?? ApplicationCommandType.ChatInput;

    switch (type) {
      case ApplicationCommandType.ChatInput:
        if (slashCommands.has(name)) {
          logger.warn({ name, kind: "slash" }, "Duplicate command name; ignoring");
          break;
        }
        slashCommands.set(name, command as SlashCommand);
        break;
      case ApplicationCommandType.User:
        if (userContextMenuCommands.has(name)) {
          logger.warn({ name, kind: "user-context-menu" }, "Duplicate command name; ignoring");
          break;
        }
        userContextMenuCommands.set(name, command as UserContextMenuCommand);
        break;
      case ApplicationCommandType.Message:
        if (messageContextMenuCommands.has(name)) {
          logger.warn({ name, kind: "message-context-menu" }, "Duplicate command name; ignoring");
          break;
        }
        messageContextMenuCommands.set(name, command as MessageContextMenuCommand);
        break;
    }
  }

  logger.debug(
    {
      slash: slashCommands.size,
      userContextMenu: userContextMenuCommands.size,
      messageContextMenu: messageContextMenuCommands.size,
    },
    "Commands registered",
  );
}

export async function deployCommands(client: Client): Promise<void> {
  const data = [
    ...slashCommands.map((command) => command.data.toJSON()),
    ...userContextMenuCommands.map((command) => command.data.toJSON()),
    ...messageContextMenuCommands.map((command) => command.data.toJSON()),
  ];
  await client.application?.commands.set(data);
  logger.debug({ commands: data.length }, "Commands deployed");
}

export function getSlashCommand(name: string): SlashCommand | undefined {
  return slashCommands.get(name);
}

export function getUserContextMenu(name: string): UserContextMenuCommand | undefined {
  return userContextMenuCommands.get(name);
}

export function getMessageContextMenu(name: string): MessageContextMenuCommand | undefined {
  return messageContextMenuCommands.get(name);
}

export function listCommands(): Command[] {
  return [
    ...slashCommands.values(),
    ...userContextMenuCommands.values(),
    ...messageContextMenuCommands.values(),
  ];
}
