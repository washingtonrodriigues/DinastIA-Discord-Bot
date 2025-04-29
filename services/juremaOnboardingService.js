import axios from 'axios';

/**
 * Função melhorada para interagir com o webhook da Jurema
 * Inclui retry, logging detalhado e notificação de erro para o usuário
 */
export default async function juremaInteraction(message, webhookUrl) {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // ms

  // Identificadores únicos para rastrear cada requisição
  const requestId = `req_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 9)}`;
  const username = message.author.username;

  console.log(
    `[${requestId}] Iniciando processamento para ${username} no canal ${message.channel.name}`,
  );

  // Extrair informações necessárias da mensagem
  const roles = message.member.roles.cache.map((role) => role.name);

  // Preparar payload para envio
  const payload = {
    username: username,
    user: message.member.displayName,
    roles: roles,
    question: message.content,
    channelId: message.channel.id,
    requestId: requestId, // Adicionando ID da requisição para rastreamento
  };

  console.log(`[${requestId}] Payload preparado para ${username}`);

  // Função para tentar enviar a requisição com retry
  async function attemptRequest(retryCount = 0) {
    try {
      console.log(
        `[${requestId}] Tentativa ${retryCount + 1}/${
          MAX_RETRIES + 1
        } para ${username}`,
      );

      // Configurando timeout para evitar esperas indefinidas
      const response = await axios.post(webhookUrl, payload, {
        timeout: 10000, // 10 segundos de timeout
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
        },
      });

      console.log(
        `[${requestId}] Resposta recebida para ${username} (status: ${response.status})`,
      );

      // Verificar se a resposta contém output
      if (response.data?.output) {
        console.log(`[${requestId}] Enviando resposta para ${username}`);

        try {
          await message.reply({
            content: response.data.output,
            allowedMentions: { parse: [] },
            flags: 1 << 2,
          });
          console.log(
            `[${requestId}] Resposta enviada com sucesso para ${username}`,
          );
          return true;
        } catch (replyError) {
          console.error(
            `[${requestId}] Erro ao responder mensagem para ${username}:`,
            replyError,
          );
          // Tentar enviar como mensagem normal se reply falhar
          try {
            await message.channel.send({
              content: `${message.author}, ${response.data.output}`,
              allowedMentions: { parse: [] },
              flags: 1 << 2,
            });
            console.log(
              `[${requestId}] Mensagem enviada como alternativa para ${username}`,
            );
            return true;
          } catch (msgError) {
            console.error(
              `[${requestId}] Erro ao enviar mensagem para ${username}:`,
              msgError,
            );
            return false;
          }
        }
      } else {
        console.log(`[${requestId}] Resposta sem output para ${username}`);

        // Se não há output mas a requisição foi bem-sucedida, não precisa retentar
        if (response.status >= 200 && response.status < 300) {
          return true;
        }

        // Tentar novamente se houver tentativas restantes
        if (retryCount < MAX_RETRIES) {
          console.log(
            `[${requestId}] Tentando novamente em ${RETRY_DELAY}ms para ${username}`,
          );
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
          return attemptRequest(retryCount + 1);
        }
        console.error(
          `[${requestId}] Sem output após ${
            MAX_RETRIES + 1
          } tentativas para ${username}`,
        );
        // Notificar o usuário sobre o problema
        notifyUserOfError(
          message,
          'Não foi possível obter uma resposta do sistema. Por favor, tente novamente mais tarde.',
        );
        return false;
      }
    } catch (error) {
      console.error(
        `[${requestId}] Erro na requisição para ${username} (tentativa ${
          retryCount + 1
        }/${MAX_RETRIES + 1}):`,
        error.message,
      );

      // Se ainda há tentativas restantes, tentar novamente
      if (retryCount < MAX_RETRIES) {
        console.log(
          `[${requestId}] Tentando novamente em ${RETRY_DELAY}ms para ${username}`,
        );
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        return attemptRequest(retryCount + 1);
      }
      console.error(
        `[${requestId}] Falha após ${
          MAX_RETRIES + 1
        } tentativas para ${username}`,
      );
      // Notificar o usuário sobre o problema
      notifyUserOfError(
        message,
        'Não foi possível conectar ao sistema de resposta. Por favor, tente novamente mais tarde.',
      );
      return false;
    }
  }

  // Função para notificar o usuário em caso de erro
  async function notifyUserOfError(message, errorMessage) {
    try {
      await message.reply({
        content: errorMessage,
        allowedMentions: { parse: [] },
        flags: 1 << 2,
      });
      console.log(
        `[${requestId}] Notificação de erro enviada para ${username}`,
      );
    } catch (error) {
      console.error(
        `[${requestId}] Erro ao enviar notificação para ${username}:`,
        error,
      );
    }
  }

  // Iniciar processo de envio com mecanismo de retry
  return attemptRequest();
}
