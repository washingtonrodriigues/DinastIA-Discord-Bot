import { config } from '../../config/config';
import EmbedFactory from '../../components/embeds';
import createButton from '../../components/buttons';

import { ChannelType, ActionRowBuilder, PermissionFlagsBits } from 'discord.js';
import juremaInteraction from '../../services/juremaOnboardingService';
import {
  createSafeChannelName,
  isMatchingChannel,
  logNormalization,
} from '../../helpers/normalization';

export async function sendInitialMessage(guild) {
  try {
    console.log('1. Iniciando sendInitialMessage...');

    const category = guild.channels.cache.find(
      (c) => c.name === 'onboard' && c.type === ChannelType.GuildCategory,
    );

    if (!category) {
      console.error("A categoria 'onboard' não existe.");
      return;
    }

    console.log('2. Categoria encontrada, procurando canal...');

    let onboardingChannel = guild.channels.cache.find(
      (c) =>
        ['🚀-comece-aqui', '🚀｜comece-aqui'].includes(c.name) &&
        c.parentId === category.id,
    );

    if (!onboardingChannel) {
      console.log('3. Canal não encontrado, criando canal 🚀｜comece-aqui...');
      onboardingChannel = await guild.channels.create({
        name: '🚀｜comece-aqui',
        type: ChannelType.GuildText,
        parent: category.id,
        topic: 'Canal de onboarding da Dinastia',
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: ['SendMessages'],
          },
          {
            id: '1311422001793208363',
            allow: [PermissionFlagsBits.ManageChannels],
          },
        ],
      });
      console.log('4. Canal criado com sucesso!');
    } else {
      console.log('3. Canal já existe, verificando mensagens...');
    }

    console.log('5. Buscando mensagens no canal...');
    const messages = await onboardingChannel.messages.fetch({ limit: 10 });
    console.log(`6. ${messages.size} mensagens encontradas.`);

    const hasOnboardingMessage = messages.some(
      (msg) =>
        msg.components?.length > 0 &&
        msg.components[0].components.some(
          (comp) => comp.customId === 'start_onboarding',
        ),
    );

    console.log(`7. Mensagem de onboarding existente: ${hasOnboardingMessage}`);

    if (!hasOnboardingMessage) {
      console.log('8. Preparando para enviar mensagem de boas-vindas...');

      console.log('9. Criando embed...');
      const embed = EmbedFactory.createWelcomeEmbed(
        '🚀 Você está no canal de onboarding da Dinastia!',
        'Ao clicar no botão abaixo, eu criarei um canal privado que somente nós e os **ADMs** teremos acesso. \n\nNesse canal, irei te guiar nos seus primeiros passos aqui na nossa comunidade. Vamos lá?',
        '',
        '',
        '#cca700',
        'DinastIA - Bem-vindo à sua jornada!',
        'https://i.imgur.com/5w4E5TO.png',
      );

      console.log('10. Criando botão...');
      const button = createButton(
        'start_onboarding',
        'Começar Onboarding',
        '🚀',
      );

      const row = new ActionRowBuilder().addComponents(button);

      console.log('11. Enviando mensagem...');
      await onboardingChannel.send({ embeds: [embed], components: [row] });
      console.log('12. Mensagem enviada com sucesso!');
    } else {
      console.log(
        '8. Mensagem de onboarding já existe, não será enviada novamente.',
      );
    }

    console.log(`13. ✅ Canal ${onboardingChannel.name} pronto para uso!`);
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem inicial:', error);
  }
}

export async function handleButtonInteraction(interaction) {
  if (interaction.customId === 'start_onboarding') {
    const guild = interaction.guild;
    const member = interaction.member;

    console.log(`Iniciando onboarding para: ${member.user.username}`);

    const category = guild.channels.cache.find(
      (c) => c.name === 'onboard' && c.type === ChannelType.GuildCategory,
    );

    if (!category) {
      return interaction.reply({
        content: "A categoria 'onboard' não existe.",
        ephemeral: true,
      });
    }

    let washington = guild.members.cache.find(
      (m) => m.user.username === 'washingtonrodriigues',
    );

    if (!washington) {
      try {
        washington = await guild.members
          .fetch({ query: 'washingtonrodriigues', limit: 1 })
          .then((members) => members.first())
          .catch(() => null);
      } catch (err) {
        console.error('Erro ao buscar o usuário washingtonrodriigues:', err);
      }
    }

    const safeChannelName = createSafeChannelName(member.user.username);
    console.log(`Nome de canal seguro criado: ${safeChannelName}`);

    const privateChannelAlreadyExists = guild.channels.cache.find((channel) =>
      isMatchingChannel(member.user.username, channel.name),
    );

    if (privateChannelAlreadyExists) {
      console.log(
        `Canal já existe para ${member.user.username}: ${privateChannelAlreadyExists.name}`,
      );
      return interaction.reply({
        content: 'Você já possui um canal privado de onboarding!',
        ephemeral: true,
      });
    }

    const originalUsername = member.user.username;

    const privateChannel = await guild.channels.create({
      name: safeChannelName,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        {
          id: member.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
          ],
        },
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: guild.roles.cache.find((role) => role.name === 'ADMIN')?.id,
          allow: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: washington?.user?.id,
          allow: [PermissionFlagsBits.ViewChannel],
        },
      ],
    });

    console.log(
      `Canal criado: ${privateChannel.name} para usuário ${originalUsername}`,
    );

    try {
      console.log(`MAPEAMENTO: ${originalUsername} -> ${privateChannel.name}`);
    } catch (err) {
      console.error('Erro ao registrar mapeamento:', err);
    }

    await privateChannel.send(
      `**Olá, ${member.user}, seja bem-vindo(a) à DinastIA!**\n\n Este canal é privado e somente você e os admins podem vê-lo. Aqui você poderá para tirar dúvidas comigo a respeito dos nossos Canais, Cargos, Trilhas e Agentes e eu irei te guiar da melhor forma nos seus primeiros passos.\n\nPara que possamos iniciar, me conte um pouco sobre o seu nível de conhecimento com Agentes IA. Você já trabalha com automações ou é seu primeiro contato?`,
    );

    return interaction.reply({
      content: `Canal privado de onboarding criado! Por favor, verifique o canal #${privateChannel.name}.`,
      ephemeral: true,
    });
  }
}

export async function handleJuremaInteraction(message) {
  try {
    if (message.author.bot) return;

    console.log(`Verificando mensagem de: ${message.author.username}`);
    console.log(`Nome do canal: ${message.channel.name}`);
    console.log(`ID da categoria: ${message.channel.parentId}`);

    const isOnboardingCategory =
      message.channel.parentId === config.CATEGORIES_ID.ONBOARDING;

    const isUserChannel = isMatchingChannel(
      message.author.username,
      message.channel.name,
    );

    logNormalization(message.author.username, message.channel.name);

    if (isOnboardingCategory && isUserChannel) {
      console.log(`Condições satisfeitas para: ${message.author.username}`);
      await juremaInteraction(message, config.WEBHOOKS.JUREMA_ONBOARDING);
    } else {
      console.log(
        `Condições não satisfeitas. OnboardingCategory: ${isOnboardingCategory}, UserChannel: ${isUserChannel}`,
      );
    }
  } catch (error) {
    console.error('Erro ao processar interação com Jurema:', error);
  }
}

export async function handleClearInactiveChannels(guild) {
  const category = guild.channels.cache.find(
    (c) => c.name === 'onboard' && c.type === ChannelType.GuildCategory,
  );

  if (!category) {
    console.log('❌ Categoria ONBOARD não encontrada.');
    return;
  }

  const channels = category.children.cache.filter(
    (c) => c.type === ChannelType.GuildText,
  );

  for (const channel of channels.values()) {
    try {
      if (['🚀-comece-aqui', '🚀｜comece-aqui'].includes(channel.name))
        continue;

      const messages = await channel.messages.fetch({ limit: 10 });

      const now = Date.now();
      const lastMessage = messages.first();

      if (!lastMessage || now - lastMessage.createdTimestamp > 60 * 60 * 1000) {
        await channel.delete();
      }
    } catch (error) {
      console.error(`❌ Erro ao processar canal ${channel.name}:`, error);
    }
  }
}

/**
 * Função melhorada para lidar com a saída de membros do servidor
 * Deleta o canal de onboarding correspondente ao usuário que saiu
 *
 * @param {GuildMember} member - O membro que saiu do servidor
 */
export async function handleMemberLeave(member) {
  const guild = member.guild;
  const username = member.user.username;

  console.log(
    `Membro ${username} (${member.user.tag}) saiu do servidor. Procurando canal para excluir...`,
  );

  const onboardCategory = guild.channels.cache.find(
    (c) => c.name === 'onboard' && c.type === ChannelType.GuildCategory,
  );

  if (!onboardCategory) {
    console.log(`Categoria 'onboard' não encontrada. Nenhuma ação necessária.`);
    return;
  }

  const onboardChannels = onboardCategory.children.cache.filter(
    (c) =>
      c.type === ChannelType.GuildText &&
      !['🚀-comece-aqui', '🚀｜comece-aqui'].includes(c.name),
  );

  console.log(
    `Encontrados ${onboardChannels.size} canais na categoria onboard.`,
  );

  const userChannel = onboardChannels.find((channel) => {
    const matches = isMatchingChannel(username, channel.name);

    if (matches) {
      logNormalization(username, channel.name);
    }

    return matches;
  });

  if (!userChannel) {
    console.log(
      `Nenhum canal com nome correspondente a ${username} encontrado. Verificando tópicos...`,
    );

    const channelByTopic = onboardChannels.find((channel) => {
      if (channel.topic?.includes(username)) {
        console.log(
          `Canal encontrado pelo tópico: ${channel.name}, tópico: ${channel.topic}`,
        );
        return true;
      }
      return false;
    });

    if (channelByTopic) {
      try {
        await channelByTopic.delete();
        console.log(
          `🗑️ Canal ${channelByTopic.name} excluído porque ${member.user.tag} saiu do servidor (correspondência por tópico).`,
        );
      } catch (error) {
        console.error(
          `❌ Erro ao excluir o canal ${channelByTopic.name}:`,
          error,
        );
      }
      return;
    }

    console.log(`ℹ️ Nenhum canal encontrado para ${member.user.tag}.`);
    return;
  }

  try {
    await userChannel.delete();
    console.log(
      `🗑️ Canal ${userChannel.name} excluído porque ${member.user.tag} saiu do servidor.`,
    );
  } catch (error) {
    console.error(`❌ Erro ao excluir o canal: ${error}`);
  }
}
