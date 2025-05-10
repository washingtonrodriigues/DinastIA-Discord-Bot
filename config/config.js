import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const config = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  JUREMA_BOT_ID: process.env.JUREMA_BOT_ID,
  EVOLUTION_URL: process.env.EVOLUTION_URL,

  WEBHOOKS: {
    PURCHASE_VALIDATION: process.env.PURCHASE_VALIDATION_WEBHOOK,
    POINTS_SYSTEM_REGISTER_VALIDATION:
      process.env.POINTS_SYSTEM_REGISTER_VALIDATION,
    POINTS_SYSTEM_GET_POINTS: process.env.POINTS_SYSTEM_GET_POINTS_WEBHOOK,
    JUREMA_ONBOARDING: process.env.JUREMA_ONBOARDING_WEBHOOK,
    SUPPORT_RANKING: process.env.SUPPORT_RANKING_WEBHOOK,
    HEY_DINASTIA: process.env.HEY_DINASTIA_WEBHOOK,
    SEND_THANKS: process.env.SEND_THANKS_WEBHOOK,
  },

  CHANNELS_ID: {
    PURCHASE_VALIDATION: process.env.PURCHASE_VALIDATION_CHANNEL_ID,
    POINTS_SYSTEM_REGISTER: process.env.POINTS_SYSTEM_REGISTER_CHANNEL_ID,
    POINTS_SYSTEM_COMMANDS: process.env.POINTS_SYSTEM_COMMANDS_CHANNEL_ID,
    THANKS: process.env.THANKS_CHANNEL_ID,
    SUPPORT: process.env.SUPPORT_CHANNEL_ID,
    GENERAL_DOUBTS: process.env.GENERAL_DOUBTS_CHANNEL_ID,
    OFIR_DOUBTS: process.env.OFIR_DOUBTS_CHANNEL_ID,
    NETSAR_DOUBTS: process.env.NETSAR_DOUBTS_CHANNEL_ID,
    BLACKS_DOUBTS: process.env.BLACKS_DOUBTS_CHANNEL_ID,
  },

  CATEGORIES_ID: {
    ONBOARDING: process.env.ONBOARDING_CATEGORY_ID,
  },

  APIKEYS: {
    EVOLUTION_JUREMA: process.env.EVOLUTION_JUREMA_API_KEY,
    PURCHASE_VALIDATION_WEBHOOK: process.env.PURCHASE_VALIDATION_WEBHOOK_APIKEY,
    POINTS_SYSTEM_REGISTER_QUERY_ID:
      process.env.POINTS_SYSTEM_REGISTER_VALIDATION_QUERY_ID,
  },

  PURCHASE_VALIDATION_THUMBNAIL_URL: 'https://via.placeholder.com/100',

  MESSAGES: {
    PURCHASE_VALIDATION: {
      WELCOME_TITLE: 'DinastIA: Validar compra!',
      WELCOME_DESCRIPTION:
        'Se você adquiriu um produto da DinastIA, clique no botão abaixo.',
      WELCOME_FIELD_TITLE: 'Orientações:',
      WELCOME_FIELD_VALUE:
        'Clique no botão "Solicitar Verificação" para começar.',

      ERROR_VALIDATION:
        'Cadastro já validado ou não encontrado. Por favor, verifique os canais já liberados para você ou chame um membro de nossa equipe abrindo um ticket em: \n\n**[Abrir Ticket](https://discord.com/channels/1300507024366374922/1325980437759266886)**',

      PROCESSING: 'Aguarde enquanto verificamos seu email.',
      SUCCESS:
        'Seu email foi verificado com sucesso! Seja bem vindo(a) DinastIA!',
    },

    POINTS_SYSTEM: {
      WELCOME_TITLE: '🚀 Cadastre-se no Sistema de Pontos da Dinastia!',
      WELCOME_DESCRIPTION:
        'Ao clicar no botão abaixo, você irá preencher um formulário de cadastro do sistema de pontos.\n\nEsse sistema é uma forma de recompensar você por sua participação ativa na comunidade Dinastia.\n\nAo longo do tempo, você poderá acumular pontos e trocá-los por prêmios incríveis!\n\nAproveite essa oportunidade e faça parte do nosso sistema de pontos!',
      PROCESSING: 'Aguarde enquanto verificamos seu e-mail e WhatsApp.',
      SUCCESS:
        'Cadastro realizado com sucesso! Seja bem vindo(a) ao Sistema de Pontos!',
      ERROR_VALIDATION:
        'Não foi possível realizar o cadastro. Verifique se você já está no Sistema de Pontos ou chame um membro de nossa equipe abrindo um ticket em: \n\n**[Abrir Ticket](https://discord.com/channels/1300507024366374922/1325980437759266886)**',
    },

    GENERAL: {
      ERROR_UNEXPECTED:
        'Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.',
      ERROR_FORM:
        'Ocorreu um erro ao abrir o formulário. Por favor, tente novamente.',
      ERROR_PROCESSING:
        'Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.',
    },
  },
  DRIVE_FOLDERS: {
    lqnl: '1dPj8FtRLv9QOjzQQvgNgUx89YaWBtmvO',
    blacks: '10q_YCyQenNN8GIqK0vodg330qQ5TvMho',
    varejo: '1tWCZLGIwKBXh1Zprh5rEiGSptm9HDSjp',
    financeiro: '1O0NUgE-EPCAt53difEiYOs4xgTVGPVH5',
    socialMedia: '1FayZYlZJ8xIuP4JdNHhq-S7WodTBAuje',
    miniTreinamentoNetsar: '1lWp6Us_OJRky9iLp6jJBPZDl8T0wDnB-',
    juridico: '1wfnpKKTFF6913WRptyHzU03PPXC3kGKD',
    ensino: '1Bhu8l6ubASnv0ukSRhnmPY8RHgJm97-9',
    trafegoPago: '1-2tRfj62nmUlB7ioTs7aVttipyVRxmVV',
    infoproduto: '1i5ytd8yNVRBow2gQrCp_XJ1uU3U4Dg02',
    imobiliario: '1dRv39NvmxNPZ6-ONUKcSkwVWqV5VBWYH',
  },
  PATHS: {
    ROOT: join(dirname(__dirname)),
    TEMP: join(dirname(__dirname), 'temp'),
    DATABASE: join(dirname(__dirname), 'database'),
  },
  OAUTH: {
    CREDENTIALS: process.env.OAUTH_CREDENTIALS,
    TOKEN: process.env.YOUTUBE_OAUTH_TOKEN,
    SCOPES: [
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.force-ssl',
      'https://www.googleapis.com/auth/drive.readonly',
    ],
  },
  YOUTUBE: {
    PRIVACY_STATUS: 'unlisted',
    CATEGORY_ID: '22',
    DEFAULT_TAGS: ['dinastia'],
  },
};
