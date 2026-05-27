import { Collection } from "discord.js";
import { glob } from "glob";
import { parse, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { logger } from "#config/logger";
import type { ButtonHandler, ModalHandler, SelectMenuHandler } from "#core/component";

const BUTTONS_DIR = fileURLToPath(new URL("./buttons/**/*.{js,ts}", import.meta.url));
const MODALS_DIR = fileURLToPath(new URL("./modals/**/*.{js,ts}", import.meta.url));
const SELECT_MENUS_DIR = fileURLToPath(new URL("./select-menus/**/*.{js,ts}", import.meta.url));

const buttons = new Collection<string, ButtonHandler>();
const modals = new Collection<string, ModalHandler>();
const selectMenus = new Collection<string, SelectMenuHandler>();

export async function registerComponents(): Promise<void> {
  await Promise.all([
    load(BUTTONS_DIR, buttons, "button"),
    load(MODALS_DIR, modals, "modal"),
    load(SELECT_MENUS_DIR, selectMenus, "select-menu"),
  ]);
  logger.debug(
    {
      buttons: buttons.size,
      modals: modals.size,
      selectMenus: selectMenus.size,
    },
    "Components registered",
  );
}

export function getButton(customId: string): ButtonHandler | undefined {
  return buttons.get(customId);
}

export function getModal(customId: string): ModalHandler | undefined {
  return modals.get(customId);
}

export function getSelectMenu(customId: string): SelectMenuHandler | undefined {
  return selectMenus.get(customId);
}

async function load<T extends { customId: string }>(
  pattern: string,
  registry: Collection<string, T>,
  kind: string,
): Promise<void> {
  const entries = await glob(pattern, { ignore: [`**${sep}index.{js,ts}`] });

  const handlers = await Promise.all(
    entries.map(async (entry) => {
      const imported = (await import(pathToFileURL(entry).href)) as {
        default?: T;
      };
      if (!imported.default) {
        throw new Error(`${kind} file "${parse(entry).base}" has no default export`);
      }
      return imported.default;
    }),
  );

  for (const handler of handlers) {
    if (registry.has(handler.customId)) {
      throw new Error(`Duplicate ${kind} customId "${handler.customId}"`);
    }
    registry.set(handler.customId, handler);
  }
}
