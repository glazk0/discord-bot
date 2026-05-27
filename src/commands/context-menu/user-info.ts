import { ContextMenuCommandBuilder, MessageFlags } from "discord.js";
import { defineUserContextMenu } from "#core/command";
import { i18next } from "#i18n/index";
import { localizations } from "#i18n/translator";

export default defineUserContextMenu({
  data: new ContextMenuCommandBuilder()
    .setName(i18next.t("user_info.name"))
    .setNameLocalizations(localizations("user_info.name")),

  async execute(interaction, { t }) {
    const target = interaction.targetUser;

    await interaction.reply({
      content: t("user_info.reply", {
        tag: target.tag,
        id: target.id,
        createdAt: Math.floor(target.createdTimestamp / 1000),
      }),
      flags: MessageFlags.Ephemeral,
    });
  },
});
