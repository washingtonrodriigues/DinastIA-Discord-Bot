import axios from 'axios';
import cron from 'node-cron';

export const sendThanks = async (message, webhookUrl) => {
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
    await axios.post(webhookUrl, { thanks: thanksData });
    console.log('Agradecimento enviado ao n8n!');
  } catch (error) {
    console.error('Erro ao enviar agradecimento ao n8n:', error);
  }
};

export const scheduleRankingJob = (client, webhookUrl) => {
  cron.schedule(
    '0 7 * * *',
    async () => {
      try {
        const response = await axios.get(webhookUrl);
        const rankingData = response.data.message;

        if (!rankingData) {
          console.error('Dados de ranking inválidos ou vazios.');
          return;
        }

        const channel = await client.channels.fetch(
          process.env.SUPPORT_CHANNEL_ID,
        );
        if (!channel) {
          console.error('Canal de ranking não encontrado!');
          return;
        }

        await channel.send(rankingData);
      } catch (error) {
        console.error('Erro ao buscar/enviar ranking:', error);
      }
    },
    {
      scheduled: true,
      timezone: 'America/Sao_Paulo',
    },
  );
  console.log('Cron Ranking Suporte Iniciado.');
};
