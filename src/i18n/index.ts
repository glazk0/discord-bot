import i18next, { type i18n as I18n } from "i18next";
import FsBackend, { type FsBackendOptions } from "i18next-fs-backend";
import { readdirSync } from "node:fs";
import { join, parse } from "node:path";
import { fileURLToPath } from "node:url";

const LOCALES_DIR = fileURLToPath(new URL("../locales", import.meta.url));

export const SUPPORTED_LOCALES: readonly string[] = readdirSync(LOCALES_DIR, {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

export type Locale = string;

export const DEFAULT_LOCALE: Locale = SUPPORTED_LOCALES.includes("en-US")
  ? "en-US"
  : (SUPPORTED_LOCALES[0] ?? "en-US");

export const NAMESPACES = ["common", "commands"] as const;
export type Namespace = (typeof NAMESPACES)[number];

export const DEFAULT_NS = "commands" as const;
export const FALLBACK_NS = "common" as const;

const expectedNamespaces = new Set<string>(NAMESPACES);
const discoveredNamespaces = readdirSync(join(LOCALES_DIR, DEFAULT_LOCALE), {
  withFileTypes: true,
})
  .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
  .map((entry) => parse(entry.name).name);

for (const ns of discoveredNamespaces) {
  if (!expectedNamespaces.has(ns)) {
    throw new Error(
      `Locale file "${ns}.json" is not registered in NAMESPACES. Add it to src/i18n/index.ts.`,
    );
  }
}

let initPromise: Promise<I18n> | null = null;

export async function initI18n(): Promise<I18n> {
  if (initPromise) return initPromise;

  initPromise = i18next
    .use(FsBackend)
    .init<FsBackendOptions>({
      lng: DEFAULT_LOCALE,
      fallbackLng: DEFAULT_LOCALE,
      supportedLngs: [...SUPPORTED_LOCALES],
      ns: [...NAMESPACES],
      defaultNS: DEFAULT_NS,
      fallbackNS: FALLBACK_NS,
      preload: [...SUPPORTED_LOCALES],
      interpolation: { escapeValue: false },
      returnNull: false,
      backend: {
        loadPath: join(LOCALES_DIR, "{{lng}}", "{{ns}}.json"),
      },
    })
    .then(() => i18next);

  return initPromise;
}

export { i18next };
