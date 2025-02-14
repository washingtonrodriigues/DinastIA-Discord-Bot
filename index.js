import pkg from 'discord.js';
const { Client, GatewayIntentBits } = pkg;

import axios from 'axios';
import dotenv from 'dotenv';
import heyDinastia from './heydinastia';
import { sendThanksToN8N } from './thanks';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const BOT_TOKEN = process.env.BOT_TOKEN;
const HEY_DINASTIA_WEBHOOK = process.env.HEY_DINASTIA_WEBHOOK;
const DOUBTS_CHANNEL_ID = process.env.DOUBTS_CHANNEL_ID;
const THANKS_CHANNEL_ID = process.env.THANKS_CHANNEL_ID;

client.once('ready', () => {
  console.log('Jurema está online!');
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.channel.id !== (DOUBTS_CHANNEL_ID || THANKS_CHANNEL_ID)) return;

  switch (message.channel.id) {
    case DOUBTS_CHANNEL_ID:
      heyDinastia(message, HEY_DINASTIA_WEBHOOK);
      break;

    case THANKS_CHANNEL_ID:
      sendThanksToN8N(message);
      break;
  }
});

client.login(BOT_TOKEN);
