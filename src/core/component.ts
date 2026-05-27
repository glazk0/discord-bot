import type {
  AnySelectMenuInteraction,
  ButtonInteraction,
  ModalSubmitInteraction,
} from "discord.js";
import type { TFunction } from "i18next";
import type { FALLBACK_NS, Locale } from "#i18n/index";

export const ID_SEP = ":";

export interface ComponentContext {
  t: TFunction<["commands", typeof FALLBACK_NS]>;
  locale: Locale;
  args: string[];
}

interface ComponentHandler<Interaction> {
  customId: string;
  execute(interaction: Interaction, ctx: ComponentContext): Promise<void> | void;
}

export type ButtonHandler = ComponentHandler<ButtonInteraction>;

export type ModalHandler = ComponentHandler<ModalSubmitInteraction>;

export type SelectMenuHandler = ComponentHandler<AnySelectMenuInteraction>;

export type ComponentInteraction =
  | ButtonInteraction
  | ModalSubmitInteraction
  | AnySelectMenuInteraction;

export interface ComponentLookupResult<I extends ComponentInteraction> {
  execute(interaction: I, ctx: ComponentContext): Promise<void> | void;
}

export type ComponentLookup<I extends ComponentInteraction> = (
  customId: string,
) => ComponentLookupResult<I> | undefined;

export function defineButton(handler: ButtonHandler): ButtonHandler {
  return handler;
}

export function defineModal(handler: ModalHandler): ModalHandler {
  return handler;
}

export function defineSelectMenu(handler: SelectMenuHandler): SelectMenuHandler {
  return handler;
}

export function buildCustomId(prefix: string, ...args: string[]): string {
  for (const segment of [prefix, ...args]) {
    if (segment.includes(ID_SEP)) {
      throw new Error(`customId segment cannot contain '${ID_SEP}': ${segment}`);
    }
  }
  return [prefix, ...args].join(ID_SEP);
}

export function parseCustomId(customId: string): {
  prefix: string;
  args: string[];
} {
  const [prefix = "", ...args] = customId.split(ID_SEP);
  return { prefix, args };
}
