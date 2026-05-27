import { MessageFlags } from "discord.js";
import { defineModal } from "#core/component";

export default defineModal({
  customId: "example",

  async execute(interaction, { t }) {
    await interaction.reply({
      content: t("example.modal.submitted"),
      flags: MessageFlags.Ephemeral,
    });
  },
});
