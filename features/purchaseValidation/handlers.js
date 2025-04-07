import { config } from '../../config/config';
import EmbedFactory from '../../components/embeds';

import createButton from '../../components/buttons';
import { createEmailModal } from './modal';
import verifyEmail from '../../services/purchaseValidationService';

export async function sendInitialMessage(client) {
  try {
    const channel = await client.channels.fetch(
      config.CHANNELS_ID.PURCHASE_VALIDATION,
    );

    if (!channel) {
      console.error('Canal não encontrado. Verifique o ID do canal.');
      return;
    }

    const messages = await channel.messages.fetch({ limit: 50 });

    const existingMessage = messages.find(
      (msg) =>
        msg.author.id === client.user.id &&
        msg.embeds.length > 0 &&
        msg.embeds[0].title ===
          config.MESSAGES.PURCHASE_VALIDATION.WELCOME_TITLE &&
        msg.components.length > 0,
    );

    if (existingMessage) {
      console.log(
        'Mensagem de validação já existe no canal. Não será enviada novamente.',
      );
      return;
    }

    const button = createButton('email_request', 'Solicitar Verificação', '✨');
    const embed = EmbedFactory.createWelcomeEmbed(
      config.MESSAGES.PURCHASE_VALIDATION.WELCOME_TITLE,
      config.MESSAGES.PURCHASE_VALIDATION.WELCOME_DESCRIPTION,
      config.MESSAGES.PURCHASE_VALIDATION.WELCOME_FIELD_TITLE,
      config.MESSAGES.PURCHASE_VALIDATION.WELCOME_FIELD_VALUE,
      '',
      '',
      config.PURCHASE_VALIDATION_THUMBNAIL_URL,
    );

    await channel.send({ embeds: [embed], components: [button] });
    console.log('Mensagem inicial enviada com sucesso!');
  } catch (error) {
    console.error('Erro ao enviar mensagem inicial:', error);
  }
}

export async function handleButtonInteraction(interaction) {
  if (interaction.customId === 'email_request') {
    try {
      const modal = createEmailModal();
      await interaction.showModal(modal);
    } catch (error) {
      console.error('Erro ao mostrar modal:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: config.MESSAGES.GENERAL.ERROR_FORM,
          ephemeral: true,
        });
      }
    }
  }
}

export async function handleModalSubmit(interaction) {
  if (interaction.customId === 'email_form') {
    try {
      const email = interaction.fields.getTextInputValue('email');

      await interaction.deferReply({ ephemeral: true });

      const processingEmbed = EmbedFactory.createProcessingEmbed(
        'Processando',
        config.MESSAGES.PURCHASE_VALIDATION.PROCESSING,
      );
      await interaction.editReply({ embeds: [processingEmbed] });

      try {
        const response = await verifyEmail(
          email,
          interaction.user.id,
          interaction.user.username,
        );

        if (response.status === 200) {
          const successEmbed = EmbedFactory.createSuccessEmbed(
            'Aprovado',
            config.MESSAGES.PURCHASE_VALIDATION.SUCCESS,
          );
          await interaction.editReply({ embeds: [successEmbed] });
        }

        if (response.status === 404) {
          const errorEmbed = EmbedFactory.createErrorEmbed(
            'Negado',
            config.MESSAGES.PURCHASE_VALIDATION.ERROR_VALIDATION,
          );
          await interaction.editReply({ embeds: [errorEmbed] });
        }
      } catch (error) {
        console.error('Erro na verificação de email:', error);
        const errorEmbed = EmbedFactory.createErrorEmbed(
          'Erro',
          config.MESSAGES.PURCHASE_VALIDATION.ERROR_VALIDATION,
        );
        await interaction.editReply({ embeds: [errorEmbed] });
      }
    } catch (error) {
      console.error('Erro ao processar modal:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: config.MESSAGES.PURCHASE_VALIDATION.PROCESSING,
          ephemeral: true,
        });
      }
    }
  }
}
