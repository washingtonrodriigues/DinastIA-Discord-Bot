import { config } from '../../config/config';
import heyDinastiaInteraction from '../../services/heyDinastiaService';

export default async function handleHeyDinastiaInteraction(message) {
  try {
    if (!message.content.includes('#heydinastia')) return;

    let tag;

    switch (message.channel.id) {
      case config.CHANNELS_ID.GENERAL_DOUBTS:
        tag = 'public';
        break;
      case config.CHANNELS_ID.OFIR_DOUBTS:
        tag = 'ofir';
        break;
      case config.CHANNELS_ID.NETSAR_DOUBTS:
        tag = 'netsar';
        break;
      case config.CHANNELS_ID.BLACKS_DOUBTS:
        tag = 'blacks';
        break;
      default:
        break;
    }

    await heyDinastiaInteraction(message, config.WEBHOOKS.HEY_DINASTIA, tag);
  } catch (error) {
    console.error('Erro ao processar interação com #heydinastia:', error);
  }
}
