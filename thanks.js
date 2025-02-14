import axios from 'axios';

export const sendThanksToN8N = async (message, webhookUrl) => {
  const mentionedUsers = message.mentions.users;
  if (!mentionedUsers.size) return;

  const thanksData = mentionedUsers.map((user) => ({
    user_id: user.id,
    username: user.username,
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
