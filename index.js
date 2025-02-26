import pkg from 'discord.js';
const { Client, GatewayIntentBits } = pkg;

import dotenv from 'dotenv';
import heyDinastia from './heydinastia';
import { sendThanks, scheduleRankingJob } from './supportRanking';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const BOT_TOKEN = process.env.BOT_TOKEN;

const DOUBTS_CHANNEL_ID = process.env.DOUBTS_CHANNEL_ID;
const THANKS_CHANNEL_ID = process.env.THANKS_CHANNEL_ID;

const HEY_DINASTIA_WEBHOOK = process.env.HEY_DINASTIA_WEBHOOK;
const SEND_THANKS_WEBHOOK = process.env.SEND_THANKS_WEBHOOK;
const SUPPORT_RANKING_WEBHOOK = process.env.SUPPORT_RANKING_WEBHOOK;

client.once('ready', () => {
  console.log('Jurema está online!');
  scheduleRankingJob(client, SUPPORT_RANKING_WEBHOOK, THANKS_CHANNEL_ID);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  switch (message.channel.id) {
    case DOUBTS_CHANNEL_ID:
      heyDinastia(message, HEY_DINASTIA_WEBHOOK);
      break;

    case THANKS_CHANNEL_ID:
      await sendThanks(message, SEND_THANKS_WEBHOOK);
      break;

    default:
      break;
  }
});

client.login(BOT_TOKEN);
