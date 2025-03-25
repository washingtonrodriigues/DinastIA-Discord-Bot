import { ChannelType, PermissionFlagsBits, MessageFlags } from 'discord.js';

export async function handleOnboardingInteraction(interaction) {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'start_onboarding') {
    const guild = interaction.guild;
    const member = interaction.member;

    let category = guild.channels.cache.find(
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
