import pkg from 'discord.js';
const { Client, GatewayIntentBits } = pkg;

import handleHeyDinastiaInteraction from './features/heyDinastia/handlers';
import { OnboardingHandlers } from './features/onboarding';
import { PurchaseValidationHandlers } from './features/purchaseValidation';
import { CronService } from './services';
import { SupportRankingHandlers } from './features/supportRanking';

import { config } from './config/config';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once('ready', async () => {
  console.log('Jurema está online!');

  await PurchaseValidationHandlers.sendInitialMessage(client);

  CronService.initializeAllCronJobs(client);

  const guild = client.guilds.cache.first();
  if (guild) {
    await OnboardingHandlers.sendInitialMessage(guild);
  } else {
    console.error('❌ Nenhuma guild encontrada.');
  }
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton()) {
    await OnboardingHandlers.handleButtonInteraction(interaction);

    if (interaction.channelId === config.CHANNELS_ID.PURCHASE_VALIDATION) {
      await PurchaseValidationHandlers.handleButtonInteraction(interaction);
    }
  } else if (interaction.isModalSubmit()) {
    await PurchaseValidationHandlers.handleModalSubmit(interaction);
  }
});

client.on('guildMemberRemove', async (member) => {
  await OnboardingHandlers.handleMemberLeave(member);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  await handleHeyDinastiaInteraction(message);

  await OnboardingHandlers.handleJuremaInteraction(message);

  if (message.channel.id === config.CHANNELS_ID.THANKS)
    await SupportRankingHandlers.handleSendThanks(message);
});

client.login(config.DISCORD_TOKEN);
