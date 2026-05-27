import { MessageFlags } from "discord.js";
import { defineSelectMenu } from "#core/component";

export default defineSelectMenu({
  customId: "example",

  async execute(interaction, { t }) {
    await interaction.reply({
      content: t("example.select.picked", {
        values: interaction.values.join(", "),
      }),
      flags: MessageFlags.Ephemeral,
    });
  },
});
