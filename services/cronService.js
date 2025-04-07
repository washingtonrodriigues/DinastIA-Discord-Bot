import cron from 'node-cron';
import { OnboardingHandlers } from '../features/onboarding';
import { SupportRankingHandlers } from '../features/supportRanking';

export function initializeAllCronJobs(client) {
  startOnboardingCleanup(client);
  startSupportRanking(client);
}

function startOnboardingCleanup(client) {
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

function startSupportRanking(client) {
  console.log('📅 Agendando envio diário de ranking de suporte...');

  cron.schedule(
    '0 7 * * *',
    async () => {
      await SupportRankingHandlers.handleGetDailyRanking(client);
    },
    {
      scheduled: true,
      timezone: 'America/Sao_Paulo',
    },
  );
}
