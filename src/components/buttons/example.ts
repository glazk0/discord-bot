import { MessageFlags } from "discord.js";
import { defineButton } from "#core/component";

export default defineButton({
  customId: "example",

  async execute(interaction, { t, args }) {
    await interaction.reply({
      content: t("example.button.clicked", { args: args.join(", ") || "—" }),
      flags: MessageFlags.Ephemeral,
    });
  },
});
