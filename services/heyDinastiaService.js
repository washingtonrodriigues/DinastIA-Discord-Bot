import axios from 'axios';

export default async function heyDinastiaInteraction(message, webhookUrl, tag) {
  try {
    const response = await axios.post(webhookUrl, {
      question: message.content,
      channelId: message.channel.id,
      tag: tag,
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
