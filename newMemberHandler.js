import { ChannelType, PermissionFlagsBits } from 'discord.js';

export async function handleNewMember(member) {
  const guild = member.guild;


  let category = guild.channels.cache.find(
    (c) => c.name === 'ONBOARDING' && c.type === ChannelType.GuildCategory
  );

  if (!category) {
    category = await guild.channels.create({
      name: 'ONBOARDING',
      type: ChannelType.GuildCategory,
    });
  }

  const channel = await guild.channels.create({
    name: `${member.user.username}`,
    type: ChannelType.GuildText,
    parent: category.id, 
    permissionOverwrites: [
      {
        id: guild.id,
        deny: [PermissionFlagsBits.ViewChannel], 
      },
      {
        id: member.user.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages], 
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
        id: guild.members.cache.find((member) => member.user.username === 'washingtonrodriigues')?.user.id, 
        allow: [PermissionFlagsBits.ViewChannel],
      }
    ],
  });


  await channel.send(
    `Olá, ${member.user}, seja bem-vindo(a) à DinastIA! Este canal é privado e somente você e os admins podem vê-lo. Aqui você poderá para tirar dúvidas comigo a respeito dos nossos Canais, Cargos, Trilhas e Agentes.\n\nPara que possamos iniciar, me conte um pouco sobre o seu nível de conhecimento com Agentes IA. Você já trabalha com automações ou é seu primeiro contato?`
  );
}
