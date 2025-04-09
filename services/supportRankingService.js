import axios from 'axios';
import { config } from '../config/config';

export default async function getSupportRanking() {
  try {
    const response = await axios.get(config.WEBHOOKS.SUPPORT_RANKING);
    const rankingData = response.data.message;

    if (!rankingData) {
      console.error('❌ Dados de ranking inválidos ou vazios.');
      return;
    }

    return rankingData;
  } catch (error) {
    console.error(
      'Erro na requisição do webhook para buscar ranking suporte:',
      error,
    );
    throw error;
  }
}
