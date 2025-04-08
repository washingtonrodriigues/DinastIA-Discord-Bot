import { ButtonBuilder, ButtonStyle } from 'discord.js';

export default function createButton(id, label, emoji) {
  return new ButtonBuilder()
    .setCustomId(id)
    .setLabel(label)
    .setStyle(ButtonStyle.Primary)
    .setEmoji(emoji);
}
