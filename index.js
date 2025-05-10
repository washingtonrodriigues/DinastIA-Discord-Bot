// index.js (versão integrada com webhook Express)
import pkg from 'discord.js';
const { Client, GatewayIntentBits } = pkg;
import express from 'express';
import bodyParser from 'body-parser';

// Importações do bot Discord
import handleHeyDinastiaInteraction from './features/heyDinastia/handlers.js';
import { OnboardingHandlers } from './features/onboarding/index.js';
import { PurchaseValidationHandlers } from './features/purchaseValidation/index.js';
import { SupportRankingHandlers } from './features/supportRanking/index.js';
import { config } from './config/config.js';
import * as CronService from './services/cronService.js';
// import { PointsSystemHandlers } from './features/pointsSystem/index.js';

// Importação das rotas do webhook
import youtubeUploaderRoutes from './features/youtubeUploader/routes.js';

// ====== CONFIGURAÇÃO DO SERVIDOR EXPRESS PARA O WEBHOOK ======
const app = express();
app.use(express.json());

// Configuração aprimorada para processamento de JSON
app.use(
  bodyParser.json({
    limit: '50mb',
    verify: (req, res, buf) => {
      try {
        JSON.parse(buf);
      } catch (e) {
        res.status(400).json({ success: false, error: 'Invalid JSON' });
        throw new Error('Invalid JSON');
      }
    },
  }),
);

// Para suportar dados URL-encoded (como os enviados por formulários)
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: '50mb',
  }),
);

// Middleware para lidar com problemas de Content-Length
app.use((req, res, next) => {
  // Remover content-length se for uma solicitação vazia
  if (
    req.headers['content-length'] === '0' ||
    (req.headers['content-length'] &&
      Number.parseInt(req.headers['content-length']) === 0)
  ) {
    req.headers['content-length'] = undefined;
  }
  next();
});

// Configurar rotas do webhook
app.use('/api/webhook', youtubeUploaderRoutes);

// Middleware para capturar erros específicos
app.use((err, req, res, next) => {
  console.error('❌ Erro no Express:', err);

  // Tratamento de erros específicos
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: 'Payload muito grande',
    });
  }

  if (
    err.type === 'request.size.invalid' ||
    err.message?.includes('request size did not match content length')
  ) {
    return res.status(400).json({
      success: false,
      error: 'Tamanho da requisição inválido',
    });
  }

  // Tratamento de erros genéricos
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Erro interno no servidor',
  });
});

// Middleware para requisições com rotas não encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint não encontrado',
  });
});

// Iniciar o servidor Express
const PORT = process.env.PORT || 8082;
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor webhook rodando na porta ${PORT}`);
  console.log(
    `📡 Webhook disponível em: http://localhost:${PORT}/api/webhook/drive-to-youtube`,
  );
});

// ====== CONFIGURAÇÃO DO BOT DISCORD ======
// Inicializa o cliente Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Tratamento de erros globais
process.on('uncaughtException', (error) => {
  console.error('❌ EXCEÇÃO NÃO CAPTURADA:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ PROMESSA REJEITADA NÃO TRATADA:', error);
});

// Função para encerrar graciosamente
const shutdown = async () => {
  console.log('🛑 Encerrando aplicação...');

  // Encerrar o servidor Express
  server.close(() => {
    console.log('✅ Servidor Express encerrado');
  });

  // Desconectar o bot Discord
  if (client?.destroy) {
    await client.destroy();
    console.log('✅ Bot Discord desconectado');
  }

  process.exit(0);
};

// Registrar handlers para encerramento gracioso
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Evento de inicialização do bot
client.once('ready', async () => {
  console.log(`🤖 Bot está online como ${client.user.tag}`);

  try {
    // Inicializa recursos do Discord
    await PurchaseValidationHandlers.sendInitialMessage(client);
    // await PointsSystemHandlers.sendInitialMessage(client);

    const guild = client.guilds.cache.first();
    if (guild) {
      await OnboardingHandlers.sendInitialMessage(guild);
    } else {
      console.error('❌ Nenhuma guild encontrada.');
    }

    // Inicializa verificação e upload de vídeos
    console.log('🎥 Inicializando serviço de upload de vídeos Drive → YouTube');

    // Inicializa cronômetros (incluindo o monitoramento de pastas)
    CronService.initializeAllCronJobs(client);

    console.log('✅ Todos os serviços inicializados com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante a inicialização:', error);
  }
});

// Eventos Discord
client.on('interactionCreate', async (interaction) => {
  try {
    if (interaction.isButton()) {
      await OnboardingHandlers.handleButtonInteraction(interaction);

      if (interaction.customId === 'email_request') {
        await PurchaseValidationHandlers.handleButtonInteraction(interaction);
      }

      // if (interaction.customId === 'points_system_register') {
      //   // await PointsSystemHandlers.handleButtonInteraction(interaction);
      // }
    } else if (interaction.isModalSubmit()) {
      if (interaction.customId === 'email_form') {
        await PurchaseValidationHandlers.handleModalSubmit(interaction);
      }

      // if (interaction.customId === 'points_system') {
      //   // await PointsSystemHandlers.handleModalSubmit(interaction);
      // }
      // } else if (interaction.isCommand()) {
      //   if (interaction.commandName === 'meuspontos') {
      //     // await PointsSystemHandlers.handleUserInteraction(interaction);
      //   }
    }
  } catch (error) {
    console.error('❌ Erro ao processar interação:', error);
  }
});

client.on('guildMemberRemove', async (member) => {
  try {
    await OnboardingHandlers.handleMemberLeave(member);
  } catch (error) {
    console.error('❌ Erro ao processar saída de membro:', error);
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  try {
    await handleHeyDinastiaInteraction(message);
    await OnboardingHandlers.handleJuremaInteraction(message);

    if (message.channel.id === config.CHANNELS_ID.THANKS) {
      await SupportRankingHandlers.handleSendThanks(message);
    }
    if (message.channel.id === config.CHANNELS_ID.POINTS_SYSTEM_COMMANDS) {
      await SupportRankingHandlers.handleSupportRanking(message);
    }
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
  }
});

// Inicializa o bot Discord
console.log('🚀 Iniciando aplicação Discord + Serviço de Upload de Vídeos');
client.login(config.DISCORD_TOKEN).catch((error) => {
  console.error('❌ Erro ao fazer login no Discord:', error);
});
