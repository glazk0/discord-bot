import type { Interaction } from "discord.js";
import { eq } from "drizzle-orm";
import { database } from "#database/client";
import { guilds } from "#database/schema/guild";
import { DEFAULT_LOCALE, type Locale, SUPPORTED_LOCALES } from "./index.ts";

const GUILD_LOCALE_TTL_SECONDS = 60 * 60;

function isSupported(value: string | null | undefined): value is Locale {
  return typeof value === "string" && SUPPORTED_LOCALES.includes(value);
}

export async function resolveLocale(interaction: Interaction): Promise<Locale> {
  if (interaction.guildId) {
    const [row] = await database
      .select({ locale: guilds.locale })
      .from(guilds)
      .where(eq(guilds.id, interaction.guildId))
      .limit(1)
      .$withCache({ config: { ex: GUILD_LOCALE_TTL_SECONDS } });

    if (isSupported(row?.locale)) return row.locale;
  }
  if (isSupported(interaction.locale)) return interaction.locale;
  return DEFAULT_LOCALE;
}

export function pickLocale(value: string | null | undefined): Locale {
  return isSupported(value) ? value : DEFAULT_LOCALE;
}
