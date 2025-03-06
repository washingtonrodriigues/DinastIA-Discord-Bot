import pkg from 'discord.js';
const { Client, GatewayIntentBits } = pkg;

import dotenv from 'dotenv';
import heyDinastia from './heydinastia';
import { sendThanks, scheduleRankingJob } from './supportRanking';
import { handleMemberLeave } from './memberLeaveHandler';
import juremaOnboarding from './juremaOnboarding';
import {  startOnboardingCleanup } from './cleanInactiveOnboardChannels';
import { handleOnboardingInteraction } from './handleOnboardingInteraction';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const BOT_TOKEN = process.env.BOT_TOKEN;

const DOUBTS_CHANNEL_ID = process.env.DOUBTS_CHANNEL_ID;
const THANKS_CHANNEL_ID = process.env.THANKS_CHANNEL_ID;

const HEY_DINASTIA_WEBHOOK = process.env.HEY_DINASTIA_WEBHOOK;
const SEND_THANKS_WEBHOOK = process.env.SEND_THANKS_WEBHOOK;
const SUPPORT_RANKING_WEBHOOK = process.env.SUPPORT_RANKING_WEBHOOK;
const JUREMA_ONBOARDING_WEBHOOK = process.env.JUREMA_ONBOARDING_WEBHOOK

const ONBOARDING_CATEGORY_ID = process.env.ONBOARDING_CATEGORY_ID;

client.once('ready', async () => {
  console.log('Jurema está online!');
  scheduleRankingJob(client, SUPPORT_RANKING_WEBHOOK, THANKS_CHANNEL_ID);
  startOnboardingCleanup(client)
});

client.on('interactionCreate', async (interaction) => {
  await handleOnboardingInteraction(interaction);
})

client.on('guildMemberRemove', async (member) => {
  await handleMemberLeave(member);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.channel.parentId === ONBOARDING_CATEGORY_ID && message.channel.name === message.author.username) await juremaOnboarding(message, JUREMA_ONBOARDING_WEBHOOK)

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
