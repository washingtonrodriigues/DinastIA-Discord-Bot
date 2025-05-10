import cron from 'node-cron';
import { OnboardingHandlers } from '../features/onboarding/index.js';
import { SupportRankingHandlers } from '../features/supportRanking/index.js';

/**
 * Inicia todas as tarefas agendadas
 * @param {Client} client - Cliente do Discord
 */
export function initializeAllCronJobs(client) {
  console.log('⏰ Inicializando todas as tarefas agendadas...');

  startOnboardingCleanup(client);
  startSupportRanking(client);
}

/**
 * Agenda a limpeza de canais de onboarding inativos
 * @param {Client} client - Cliente do Discord
 */
export function startOnboardingCleanup(client) {
  console.log('📅 Agendando limpeza automática de canais de onboarding...');

  cron.schedule('0 * * * *', async () => {
    console.log('🧹 Executando limpeza de canais de onboarding inativos...');

    try {
      for (const guild of client.guilds.cache.values()) {
        await OnboardingHandlers.handleClearInactiveChannels(guild);
      }

      console.log('✅ Limpeza de canais concluída com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao executar limpeza de canais:', error);
    }
  });
}

/**
 * Agenda o envio diário do ranking de suporte
 * @param {Client} client - Cliente do Discord
 */
export function startSupportRanking(client) {
  console.log('📅 Agendando envio diário de ranking de suporte...');

  cron.schedule(
    '0 7 * * *',
    async () => {
      try {
        await SupportRankingHandlers.handleGetDailyRanking(client);
      } catch (error) {
        console.error('❌ Erro ao processar ranking diário:', error);
      }
    },
    {
      scheduled: true,
      timezone: 'America/Sao_Paulo',
    },
  );
}
