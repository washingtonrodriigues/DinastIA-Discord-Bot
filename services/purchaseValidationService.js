import axios from 'axios';
import { config } from '../config/config';

export default async function verifyEmail(email, discordId, username) {
  try {
    const response = await axios.post(
      config.WEBHOOKS.PURCHASE_VALIDATION,
      {
        email,
        discordId,
        username,
      },
      {
        headers: {
          Authorization: config.APIKEYS.PURCHASE_VALIDATION_WEBHOOK,
        },
      },
    );

    return response;
  } catch (error) {
    console.error('Erro na requisição do webhook:', error);
    throw error;
  }
}
