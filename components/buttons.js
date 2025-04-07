import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default function createButton(id, label, emoji) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(id)
      .setLabel(label)
      .setStyle(ButtonStyle.Primary)
      .setEmoji(emoji),
  );
}
