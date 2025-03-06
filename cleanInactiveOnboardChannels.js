import { ChannelType } from "discord.js";
import cron from 'node-cron';

export async function cleanInactiveOnboardingChannels(guild) {
  const category = guild.channels.cache.find(
    (c) => c.name === "onboard" && c.type === ChannelType.GuildCategory
  );

  if (!category) {
    console.log("❌ Categoria ONBOARD não encontrada.");
    return;
  }

  const channels = category.children.cache.filter(
    (c) => c.type === ChannelType.GuildText
  );

  for (const channel of channels.values()) {
    try {
      if (channel.name === ('🚀-comece-aqui', '🚀｜comece-aqui')) continue;

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

export function startOnboardingCleanup(client) {
  cron.schedule('0 * * * *', async () => {
    const guild = client.guilds.cache.first();
    if (guild) {
      await cleanInactiveOnboardingChannels(guild);
    }
  });
}