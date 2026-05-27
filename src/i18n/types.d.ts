// oxlint-disable-next-line no-unassigned-import -- required to extend the i18next module via declaration merging
import "i18next";
import type commands from "../locales/en-US/commands.json";
import type common from "../locales/en-US/common.json";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "commands";
    fallbackNS: "common";
    resources: {
      common: typeof common;
      commands: typeof commands;
    };
    returnNull: false;
  }
}
