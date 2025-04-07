export const config = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,

  WEBHOOKS: {
    PURCHASE_VALIDATION: process.env.PURCHASE_VALIDATION_WEBHOOK,
    JUREMA_ONBOARDING: process.env.JUREMA_ONBOARDING_WEBHOOK,
    SUPPORT_RANKING: process.env.SUPPORTE_RANKING_WEBHOOK,
    HEY_DINASTIA: process.env.HEY_DINASTIA_WEBHOOK,
    SEND_THANKS: process.env.SEND_THANKS_WEBHOOK,
  },

  CHANNELS_ID: {
    PURCHASE_VALIDATION: process.env.PURCHASE_VALIDATION_CHANNEL_ID,
    THANKS: process.env.THANKS_CHANNEL_ID,
    GENERAL_DOUBTS: process.env.GENERAL_DOUBTS_CHANNEL_ID,
    OFIR_DOUBTS: process.env.OFIR_DOUBTS_CHANNEL_ID,
    NETSAR_DOUBTS: process.env.NETSAR_DOUBTS_CHANNEL_ID,
    BLACKS_DOUBTS: process.env.BLACKS_DOUBTS_CHANNEL_ID,
  },

  CATEGORIES_ID: {
    ONBOARDING: process.env.ONBOARDING_CATEGORY_ID,
  },

  APIKEYS: {
    PURCHASE_VALIDATION_WEBHOOK: process.env.PURCHASE_VALIDATION_WEBHOOK_APIKEY,
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
        'Infelizmente não conseguimos verificar seu email. Por favor, confirme se o seus dados estão corretos, tente novamente ou chame um membro de nossa equipe.',

      PROCESSING: 'Aguarde enquanto verificamos seu email.',
      SUCCESS:
        'Seu email foi verificado com sucesso! Seja bem vindo(a) DinastIA!',
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
};
