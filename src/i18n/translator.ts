import type { Locale as DiscordLocale, LocalizationMap } from "discord.js";
import type { ParseKeys, TFunction } from "i18next";
import {
  DEFAULT_LOCALE,
  DEFAULT_NS,
  FALLBACK_NS,
  i18next,
  type Locale,
  type Namespace,
  SUPPORTED_LOCALES,
} from "./index.ts";

export function translator<N extends Namespace = typeof DEFAULT_NS>(
  locale: Locale,
  ns: N = DEFAULT_NS as N,
): TFunction<[N, typeof FALLBACK_NS]> {
  return i18next.getFixedT<[N, typeof FALLBACK_NS]>(locale, [ns, FALLBACK_NS]);
}

export function localizations(key: ParseKeys<typeof DEFAULT_NS>): LocalizationMap;
export function localizations<N extends Namespace>(key: ParseKeys<N>, ns: N): LocalizationMap;
export function localizations(key: string, ns: Namespace = DEFAULT_NS): LocalizationMap {
  const map: LocalizationMap = {};

  for (const lng of SUPPORTED_LOCALES) {
    if (lng === DEFAULT_LOCALE) continue;
    const value = i18next.t(key, { ns, lng, defaultValue: "" });
    if (typeof value === "string" && value.length > 0) {
      map[lng as DiscordLocale] = value;
    }
  }

  return map;
}
