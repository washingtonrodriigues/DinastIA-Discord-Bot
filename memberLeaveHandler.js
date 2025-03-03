export async function handleMemberLeave(member) {
    const guild = member.guild;
  
    const channel = guild.channels.cache.find(
      (c) => c.name === `${member.user.username}` && c.parent?.name === 'onboard'
    );
  
    if (channel) {
      try {
        await channel.delete();
        console.log(`🗑️ Canal ${channel.name} excluído porque ${member.user.tag} saiu do servidor.`);
      } catch (error) {
        console.error(`❌ Erro ao excluir o canal: ${error}`);
      }
    } else {
      console.log(`ℹ️ Nenhum canal encontrado para ${member.user.tag}.`);
    }
  }
  