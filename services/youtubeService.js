// services/youtubeService.js
import { google } from 'googleapis';
import fs from 'node:fs';
import { createInterface } from 'node:readline';
import { config } from '../config/config.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as dotenv from 'dotenv';

/**
 * Inicializa o cliente do YouTube com OAuth
 * @param {boolean} forceRenewal - Força renovação do token mesmo se existir
 * @returns {Promise<Object>} Cliente autenticado do YouTube
 */
export async function initYoutubeClient(forceRenewal = false) {
  try {
    // Verifica se temos credenciais no ambiente
    if (!config.OAUTH.CREDENTIALS) {
      throw new Error(
        'Credenciais OAuth não encontradas no ambiente (OAUTH_CREDENTIALS)',
      );
    }

    // Parse das credenciais
    const credentials = JSON.parse(config.OAUTH.CREDENTIALS);

    // Configura o cliente OAuth
    const { client_secret, client_id, redirect_uris } =
      credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0] || 'http://localhost',
    );

    // Se forceRenewal for true, pula a verificação de token existente
    if (!forceRenewal && config.OAUTH.TOKEN) {
      const token = JSON.parse(config.OAUTH.TOKEN);
      oAuth2Client.setCredentials(token);
      console.log('🔑 Token OAuth carregado do ambiente');

      // Verificar se o token já expirou
      const currentTime = Date.now();
      if (token.expiry_date && token.expiry_date <= currentTime) {
        console.log('⚠️ Token expirado, tentando renovar com refresh_token');
        // Se temos refresh_token, tenta renovar automaticamente
        if (token.refresh_token) {
          return await refreshAccessToken(oAuth2Client, token);
        }
        console.warn('❌ Refresh token não disponível, necessário novo token');
      } else {
        // Token ainda válido
        return google.youtube({ version: 'v3', auth: oAuth2Client });
      }
    }

    // Se chegou aqui, precisamos de um novo token
    return await getNewToken(oAuth2Client);
  } catch (error) {
    console.error('❌ Erro ao inicializar cliente do YouTube:', error);
    throw error;
  }
}

/**
 * Renova o token OAuth usando o refresh_token
 * @param {Object} oAuth2Client - Cliente OAuth2
 * @param {Object} token - Token atual com refresh_token
 * @returns {Promise<Object>} Cliente autenticado do YouTube
 */
async function refreshAccessToken(oAuth2Client, token) {
  try {
    console.log('🔄 Tentando renovar o token OAuth automaticamente...');

    // Configura o refresh_token
    oAuth2Client.setCredentials({
      refresh_token: token.refresh_token,
    });

    // Solicita um novo token usando o refresh_token
    const { credentials } = await oAuth2Client.refreshAccessToken();

    // Importante: manter o refresh_token original se não for retornado um novo
    if (!credentials.refresh_token && token.refresh_token) {
      credentials.refresh_token = token.refresh_token;
    }

    console.log('✅ Token renovado com sucesso');

    // Atualiza o token no .env
    await updateTokenInEnvFile(credentials);

    oAuth2Client.setCredentials(credentials);
    return google.youtube({ version: 'v3', auth: oAuth2Client });
  } catch (error) {
    console.error('❌ Erro ao renovar token:', error);
    console.log(
      '⚠️ Não foi possível renovar automaticamente, solicitando novo token...',
    );

    // Tenta enviar notificação via WhatsApp se disponível
    try {
      await sendWhatsAppNotification(
        `🚨 *ERRO NO SISTEMA* 🚨\n\n*Serviço:* Upload YouTube\n*Erro:* Token expirado e não foi possível renovar automaticamente\n*Detalhe:* ${error.message}\n\n_É necessário fazer login manual no sistema._`,
      );
    } catch (notifyError) {
      console.error('❌ Erro ao enviar notificação:', notifyError);
    }

    // Se não conseguir renovar, solicita um novo token manualmente
    return await getNewToken(oAuth2Client);
  }
}

/**
 * Atualiza o token no arquivo .env
 * @param {Object} token - Novo token
 * @returns {Promise<void>}
 */
async function updateTokenInEnvFile(token) {
  try {
    // Converte o objeto token para string JSON
    const tokenStr = JSON.stringify(token);

    // Determina o caminho do arquivo .env (assumindo que está na raiz do projeto)
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const envPath = path.resolve(__dirname, '..', '.env');

    // Verifica se o arquivo .env existe
    if (fs.existsSync(envPath)) {
      // Lê o conteúdo atual do arquivo .env
      let envContent = fs.readFileSync(envPath, 'utf8');

      // Verifica se a variável YOUTUBE_OAUTH_TOKEN já existe no arquivo
      if (envContent.includes('YOUTUBE_OAUTH_TOKEN=')) {
        // Substitui o valor existente
        envContent = envContent.replace(
          /YOUTUBE_OAUTH_TOKEN=.*/,
          `YOUTUBE_OAUTH_TOKEN=${tokenStr}`,
        );
      } else {
        // Adiciona a nova variável ao final do arquivo
        envContent += `\nYOUTUBE_OAUTH_TOKEN=${tokenStr}`;
      }

      // Escreve o conteúdo atualizado de volta para o arquivo .env
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Token atualizado no arquivo .env');

      // Recarrega as variáveis de ambiente
      dotenv.config();
    } else {
      console.warn(
        '⚠️ Arquivo .env não encontrado. O token foi renovado apenas em memória.',
      );
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar token no arquivo .env:', error);
    // Não falha o processo se não conseguir atualizar o arquivo
  }
}

/**
 * Obtém um novo token OAuth
 * @param {Object} oAuth2Client - Cliente OAuth2
 * @returns {Promise<Object>} Cliente autenticado do YouTube
 */
async function getNewToken(oAuth2Client) {
  return new Promise((resolve, reject) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: config.OAUTH.SCOPES,
      prompt: 'consent', // Importante: força a geração de um novo refresh_token
    });

    console.log('\n🔐 Autorização necessária para acessar o YouTube e Drive');
    console.log(
      'Por favor, acesse a seguinte URL para autorizar este aplicativo:',
    );
    console.log(
      '----------------------------------------------------------------------',
    );
    console.log(authUrl);
    console.log(
      '----------------------------------------------------------------------\n',
    );

    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('Cole o código de autorização aqui: ', async (code) => {
      rl.close();

      try {
        // Troca o código pelo token
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);

        // Atualiza o token no .env
        await updateTokenInEnvFile(tokens);

        // Exibe o token para adicionar ao ambiente
        console.log(
          '\n⚠️ IMPORTANTE: Token OAuth foi atualizado automaticamente no arquivo .env',
        );
        console.log(
          '----------------------------------------------------------------------',
        );
        console.log(JSON.stringify(tokens));
        console.log(
          '----------------------------------------------------------------------\n',
        );

        // Envia notificação de sucesso
        try {
          await sendWhatsAppNotification(
            '✅ *Token YouTube atualizado com sucesso*\n\nO token do YouTube foi renovado manualmente e está funcionando corretamente agora.',
          );
        } catch (notifyError) {
          console.warn(
            '⚠️ Não foi possível enviar notificação de sucesso:',
            notifyError,
          );
        }

        resolve(google.youtube({ version: 'v3', auth: oAuth2Client }));
      } catch (error) {
        console.error('❌ Erro ao obter token:', error);
        reject(error);
      }
    });
  });
}

/**
 * Faz upload de um vídeo para o YouTube
 * @param {string} filePath - Caminho do arquivo local
 * @param {Object} metadata - Metadados do vídeo
 * @returns {Promise<Object>} Resposta do YouTube
 */
export async function uploadVideo(filePath, metadata) {
  try {
    console.log(`🚀 Iniciando upload para o YouTube: ${metadata.title}`);

    // Inicializa o cliente
    let youtube = await initYoutubeClient();

    // Verifica o tamanho do arquivo
    const fileStats = fs.statSync(filePath);
    const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
    console.log(`📊 Tamanho do arquivo: ${fileSizeMB} MB`);

    // Prepara os metadados
    const videoData = {
      snippet: {
        title: metadata.title,
        description: metadata.description,
        tags: [
          ...(metadata.tags || []),
          ...(config.YOUTUBE.DEFAULT_TAGS || []),
        ],
        categoryId: metadata.categoryId || config.YOUTUBE.CATEGORY_ID || '22', // 22 = People & Blogs
      },
      status: {
        privacyStatus:
          metadata.privacyStatus || config.YOUTUBE.PRIVACY_STATUS || 'unlisted',
        selfDeclaredMadeForKids: false,
      },
    };

    // Configurações da requisição
    const requestOptions = {
      part: 'snippet,status',
      requestBody: videoData,
      media: {
        body: fs.createReadStream(filePath),
      },
      // Configurações adicionais para garantir que o upload seja concluído
      retryConfig: {
        retry: 5,
        retryDelay: 1000,
        shouldRetry: (err) => {
          return err && (err.code >= 500 || err.code === 'ECONNRESET');
        },
      },
    };

    console.log('⏳ Enviando vídeo para o YouTube, aguarde...');

    // Tenta fazer upload do vídeo
    try {
      // Faz upload do vídeo
      const response = await youtube.videos.insert(requestOptions);

      // Verifica se o upload foi bem-sucedido
      if (!response || !response.data || !response.data.id) {
        throw new Error(
          'Resposta do YouTube inválida. Upload pode ter falhado.',
        );
      }

      console.log(`✅ Upload concluído! ID: ${response.data.id}`);
      console.log(
        `🔗 URL: https://www.youtube.com/watch?v=${response.data.id}`,
      );

      // Verifica o status do vídeo logo após o upload
      await verifyVideoStatus(youtube, response.data.id);

      return response.data;
    } catch (uploadError) {
      // Verifica se o erro é de token inválido
      if (
        uploadError.message?.includes('invalid_token') ||
        uploadError.message?.includes('Invalid Credentials') ||
        uploadError.message?.includes('Token has been expired or revoked')
      ) {
        console.warn('⚠️ Token inválido ou expirado. Tentando renovar...');

        // Tenta renovar o token e tentar novamente
        youtube = await initYoutubeClient(true); // force renewal

        // Tenta o upload novamente após renovar o token
        console.log('🔄 Tentando upload novamente com novo token...');

        // Cria um novo stream para o arquivo (o anterior pode ter sido fechado)
        requestOptions.media.body = fs.createReadStream(filePath);

        const retryResponse = await youtube.videos.insert(requestOptions);

        // Verifica novamente se o upload foi bem-sucedido
        if (!retryResponse || !retryResponse.data || !retryResponse.data.id) {
          throw new Error(
            'Resposta do YouTube inválida após renovação de token.',
          );
        }

        console.log(
          `✅ Upload concluído após renovação! ID: ${retryResponse.data.id}`,
        );
        console.log(
          `🔗 URL: https://www.youtube.com/watch?v=${retryResponse.data.id}`,
        );

        // Verifica o status do vídeo logo após o upload
        await verifyVideoStatus(youtube, retryResponse.data.id);

        return retryResponse.data;
      }
      // Se não for problema de token, repassa o erro
      throw uploadError;
    }
  } catch (error) {
    console.error('❌ Erro ao fazer upload para o YouTube:', error);

    if (error.response) {
      console.error('Detalhes do erro:', {
        status: error.response.status,
        message: error.response.data.error?.message || 'Sem mensagem',
      });
    }

    // Tenta enviar notificação via WhatsApp
    try {
      await sendWhatsAppNotification(
        `🚨 *FALHA NO UPLOAD* 🚨\n\n*Arquivo:* ${metadata.title}\n*Erro:* ${error.message}\n\nPor favor, verifique os logs do sistema para mais detalhes.`,
      );
    } catch (notifyError) {
      console.error('Não foi possível enviar notificação:', notifyError);
    }

    throw error;
  }
}

/**
 * Verifica o status de processamento do vídeo no YouTube
 * @param {Object} youtube - Cliente YouTube
 * @param {string} videoId - ID do vídeo
 * @returns {Promise<void>}
 */
async function verifyVideoStatus(youtube, videoId) {
  try {
    console.log(`🔍 Verificando status do vídeo ${videoId}...`);

    const response = await youtube.videos.get({
      id: videoId,
      part: 'status,processingDetails',
    });

    const processingStatus =
      response.data.processingDetails?.processingStatus || 'unknown';
    const uploadStatus = response.data.status?.uploadStatus || 'unknown';

    console.log(`📊 Status de processamento: ${processingStatus}`);
    console.log(`📤 Status de upload: ${uploadStatus}`);

    if (uploadStatus !== 'processed' && uploadStatus !== 'uploaded') {
      console.warn(
        `⚠️ O vídeo pode não estar totalmente processado ainda. Status: ${uploadStatus}`,
      );
    }

    return response.data;
  } catch (error) {
    console.warn(
      `⚠️ Não foi possível verificar o status do vídeo: ${error.message}`,
    );
    // Não falha se não conseguir verificar o status
  }
}

/**
 * Envia uma notificação via WhatsApp usando a Evolution API
 * @param {string} message - Mensagem a ser enviada
 * @returns {Promise<void>}
 */
async function sendWhatsAppNotification(message) {
  try {
    // Verifica se temos a URL da Evolution API configurada
    const webhookUrl = config.WEBHOOKS.HEY_DINASTIA_WEBHOOK;

    if (!webhookUrl) {
      console.warn('⚠️ URL da Evolution API não configurada');
      return;
    }

    // Define o número que receberá a notificação (pode ser configurado em um ambiente separado)
    const recipientNumber = '557999216703'; // Número de telefone para receber as notificações

    // Formato correto para a Evolution API conforme documentação
    const payload = {
      number: recipientNumber,
      text: message,
    };

    console.log('📱 Enviando notificação WhatsApp para', recipientNumber);

    const response = await fetch(`${webhookUrl}/message/sendText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(
        `Erro ao enviar mensagem: ${response.status} ${response.statusText}`,
      );
    }

    console.log('✅ Notificação WhatsApp enviada com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar notificação WhatsApp:', error);
    // Não falha o processo principal se não conseguir enviar notificação
    return false;
  }
}

/**
 * Utilitário para renovar manualmente o token OAuth
 * Este método pode ser chamado diretamente quando necessário
 * @returns {Promise<void>}
 */
export async function renewTokenManually() {
  try {
    console.log('🔄 Iniciando processo de renovação manual do token OAuth');

    // Força a obtenção de um novo token
    await initYoutubeClient(true);

    console.log('✅ Processo de renovação manual concluído com sucesso');
  } catch (error) {
    console.error('❌ Erro durante renovação manual do token:', error);
    throw error;
  }
}
