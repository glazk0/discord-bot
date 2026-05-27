import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { defineCommand } from "#core/command";
import { i18next } from "#i18n/index";
import { localizations } from "#i18n/translator";

export default defineCommand({
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription(i18next.t("ping.description"))
    .setDescriptionLocalizations(localizations("ping.description")),

  async execute(interaction, { t }) {
    await interaction.reply({
      content: t("ping.reply", { ms: interaction.client.ws.ping }),
      flags: MessageFlags.Ephemeral,
    });
  },
});
