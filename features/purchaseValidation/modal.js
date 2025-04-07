import {
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';

export function createEmailModal() {
  return new ModalBuilder()
    .setCustomId('email_form')
    .setTitle('Verificação de Email de Compra')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('email')
          .setLabel('Digite o email usado na compra.')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('exemplo@email.com')
          .setRequired(true),
      ),
    );
}
