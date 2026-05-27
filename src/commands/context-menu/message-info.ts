import { defineMessageContextMenu } from "#core/command";
import { i18next } from "#i18n/index";
import { localizations } from "#i18n/translator";
import { ContextMenuCommandBuilder, MessageFlags } from "discord.js";

export default defineMessageContextMenu({
  data: new ContextMenuCommandBuilder()
    .setName(i18next.t("message_info.name"))
    .setNameLocalizations(localizations("message_info.name")),

  async execute(interaction, { t }) {
    const target = interaction.targetMessage;

    await interaction.reply({
      content: t("message_info.reply", {
        author: target.author.tag,
        id: target.id,
        chars: target.content.length,
      }),
      flags: MessageFlags.Ephemeral,
    });
  },
});
