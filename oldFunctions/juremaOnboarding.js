import axios from 'axios';

export default async function juremaOnboarding(message, webhookUrl) {
  const roles = message.member.roles.cache.map((role) => role.name);

  try {
    const response = await axios.post(webhookUrl, {
      username: message.author.username,
      user: message.member.displayName,
      roles: roles,
      question: message.content,
      channelId: message.channel.id,
    });

    if (response.data.output) {
      message.reply({
        content: response.data.output,
        allowedMentions: { parse: [] },
        flags: 1 << 2,
      });
    }
  } catch (error) {
    console.error('Erro ao acessar o n8n:', error);
  }
}
