import {
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  GuildDefaultMessageNotifications,
} from 'discord.js';

export async function startOnboardingChannel(guild) {
  let category = guild.channels.cache.find(
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

    const embed = new EmbedBuilder()
      .setColor('#cca700')
      .setTitle('🚀 Você está no canal de onboarding da Dinastia!')
      .setDescription(
        'Ao clicar no botão abaixo, eu criarei um canal privado que somente nós e os **ADMs** teremos acesso.\n\n' +
          'Nesse canal, irei te guiar nos seus primeiros passos aqui na nossa comunidade. Vamos lá?',
      )
      .setFooter({
        text: 'DinastIA - Bem-vindo à sua jornada!',
        iconURL: 'https://i.imgur.com/5w4E5TO.png',
      });

    const button = new ButtonBuilder()
      .setCustomId('start_onboarding')
      .setLabel('Começar Onboarding')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🚀');

    const row = new ActionRowBuilder().addComponents(button);

    await onboardingChannel.send({ embeds: [embed], components: [row] });
  }

  console.log(`✅ Canal ${onboardingChannel.name} pronto para uso!`);
}
