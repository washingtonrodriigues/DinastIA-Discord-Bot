import axios from 'axios';
import { config } from '../../config/config';
import getSupportRanking from '../../services/supportRankingService';

export async function handleGetDailyRanking(client) {
  try {
    console.log('📊 Buscando dados de ranking de suporte...');

    const rankingData = await getSupportRanking();

    const channel = await client.channels.fetch(config.CHANNELS_ID.SUPPORT);

    if (!channel) {
      console.error('❌ Canal de ranking não encontrado!');
      return;
    }

    await channel.send(rankingData);
    console.log('✅ Ranking de suporte enviado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao processar ranking de suporte:', error);
  }
}

export async function handleSendThanks(message) {
  const mentionedUsers = message.mentions.users;
  if (!mentionedUsers.size) return;

  const thanksData = mentionedUsers.map((user) => ({
    support_id: user.id,
    support: user.username,
    thanked_by: message.author.username,
    message_content: message.content,
    timestamp: new Date().toISOString(),
  }));

  try {
    await axios.post(config.WEBHOOKS.SEND_THANKS, { thanks: thanksData });
    console.log('Agradecimento enviado ao n8n!');
  } catch (error) {
    console.error('Erro ao enviar agradecimento ao n8n:', error);
  }
}
