import pkg from 'discord.js';
const { Client, GatewayIntentBits } = pkg;

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const BOT_TOKEN = process.env.BOT_TOKEN;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const DOUBTS_CHANNEL_ID = process.env.DOUBTS_CHANNEL_ID;
const THANKS_CHANNEL_ID = process.env.THANKS_CHANNEL_ID;

client.once('ready', () => {
  console.log('Jurema está online!');
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.channel.id !== (DOUBTS_CHANNEL_ID || THANKS_CHANNEL_ID)) return;

  try {
    const response = await axios.post(N8N_WEBHOOK_URL, {
      question: message.content,
      userId: message.author.id,
    });

    if (response.data.output) {
      const formattedMessage = formatMessage(response.data.output);
      message.reply(formattedMessage);
    }
  } catch (error) {
    console.error('Erro ao acessar o n8n:', error);
  }
});

// Função para desativar o preview dos links
const formatMessage = (text) => {
  return text.replace(/https:\/\/\S+/g, (link) => `<${link}>`);
};

client.login(BOT_TOKEN);
