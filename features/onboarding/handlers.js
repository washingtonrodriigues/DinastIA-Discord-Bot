import { config } from '../../config/config';
import EmbedFactory from '../../components/embeds';
import createButton from '../../components/buttons';

import { ChannelType, ActionRowBuilder, PermissionFlagsBits } from 'discord.js';
import juremaInteraction from '../../services/juremaOnboardingService';

export async function sendInitialMessage(guild) {
  try {
    const category = guild.channels.cache.find(
      (c) => c.name === 'onboard' && c.type === ChannelType.GuildCategory,
    );

    if (!category) {
      console.error("A categoria 'onboard' não existe.");
      return;
    }

    let onboardingChannel = guild.channels.cache.find(
      (c) =>
        ['🚀-comece-aqui', '🚀｜comece-aqui'].includes(c.name) &&
        c.parentId === category.id,
    );

    if (!onboardingChannel) {
      console.log('📢 Criando canal 🚀｜comece-aqui...');
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
        ],
      });

      const embed = EmbedFactory.createWelcomeEmbed(
        '🚀 Você está no canal de onboarding da Dinastia!',
        'Ao clicar no botão abaixo, eu criarei um canal privado que somente nós e os **ADMs** teremos acesso.\n\n' +
          'Nesse canal, irei te guiar nos seus primeiros passos aqui na nossa comunidade. Vamos lá?',
        '',
        '',
        'DinastIA - Bem-vindo à sua jornada!',
        'https://i.imgur.com/5w4E5TO.png',
        '',
      );

      const button = createButton(
        'start_onboarding',
        'Começar Onboarding',
        '🚀',
      );

      const row = new ActionRowBuilder().addComponents(button);

      await onboardingChannel.send({ embeds: [embed], components: [row] });
    }

    console.log(`✅ Canal ${onboardingChannel.name} pronto para uso!`);
  } catch (error) {}
}

export async function handleButtonInteraction(interaction) {
  if (interaction.customId === 'start_onboarding') {
    const guild = interaction.guild;
    const member = interaction.member;

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

    const privateChannelAlreadyExists = guild.channels.cache.find(
      (g) => g.name === member.user.username,
    );

    if (privateChannelAlreadyExists) {
      return interaction.reply({
        content: 'Você já possui um canal privado de onboarding!',
        ephemeral: true,
      });
    }

    const privateChannel = await guild.channels.create({
      name: `${member.user.username}`,
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
          id: washington.user.id,
          allow: [PermissionFlagsBits.ViewChannel],
        },
      ],
    });

    await privateChannel.send(
      `**Olá, ${member.user}, seja bem-vindo(a) à DinastIA!**\n\n Este canal é privado e somente você e os admins podem vê-lo. Aqui você poderá para tirar dúvidas comigo a respeito dos nossos Canais, Cargos, Trilhas e Agentes e eu irei te guiar da melhor forma nos seus primeiros passos.\n\nPara que possamos iniciar, me conte um pouco sobre o seu nível de conhecimento com Agentes IA. Você já trabalha com automações ou é seu primeiro contato?`,
    );
  }
}

export async function handleJuremaInteraction(message) {
  try {
    if (message.author.bot) return;

    if (
      message.channel.parentId === config.CATEGORIES_ID.ONBOARDING &&
      message.channel.name === message.author.username
    ) {
      await juremaInteraction(message, config.WEBHOOKS.JUREMA_ONBOARDING);
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
      if (channel.name === ('🚀-comece-aqui' || '🚀｜comece-aqui')) continue;

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

export async function handleMemberLeave(member) {
  const guild = member.guild;

  const channel = guild.channels.cache.find(
    (c) => c.name === `${member.user.username}` && c.parent?.name === 'onboard',
  );

  if (channel) {
    try {
      await channel.delete();
      console.log(
        `🗑️ Canal ${channel.name} excluído porque ${member.user.tag} saiu do servidor.`,
      );
    } catch (error) {
      console.error(`❌ Erro ao excluir o canal: ${error}`);
    }
  } else {
    console.log(`ℹ️ Nenhum canal encontrado para ${member.user.tag}.`);
  }
}
