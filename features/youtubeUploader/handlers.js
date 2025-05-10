// features/youtubeUploader/handlers.js
import * as driveService from '../../services/driveService.js';
import * as youtubeService from '../../services/youtubeService.js';
import * as fileRepository from '../../database/fileRepository.js';
import * as fileUtils from '../../utils/fileUtils.js';
import { config } from '../../config/config.js';

/**
 * Webhook para processar um único arquivo do Drive e fazer upload para o YouTube
 * @param {Object} req - Request HTTP
 * @param {Object} res - Response HTTP
 */
export async function driveToYoutubeWebhook(req, res) {
  // Variável para armazenar o caminho do arquivo temporário
  let filePath = null;

  try {
    console.log('🔄 Recebido webhook para processamento de arquivo');

    // Validar payload da requisição
    const { fileId, folderName } = req.body;

    console.log('🔍 Payload recebido:', req.body);

    if (!fileId) {
      console.error('❌ ID do arquivo não fornecido no payload');
      return res.status(400).json({
        success: false,
        error: 'ID do arquivo é obrigatório',
      });
    }

    console.log(`🔍 Processando arquivo: ${fileId}`);

    // Verificar se o arquivo já foi processado
    let alreadyProcessed = false;
    try {
      alreadyProcessed = await fileRepository.isFileProcessed(fileId);
    } catch (dbError) {
      console.warn('⚠️ Erro ao verificar processamento anterior:', dbError);
      // Continua o processamento mesmo com erro no banco de dados
    }

    if (alreadyProcessed) {
      console.log(`✓ Arquivo ${fileId} já foi processado anteriormente`);
      return res.status(200).json({
        success: true,
        status: 'already_processed',
        message: 'Arquivo já foi processado anteriormente',
      });
    }

    try {
      // Inicializar cliente do Drive
      const drive = await driveService.initDriveClient();

      // Obter detalhes do arquivo do Drive
      console.log(`🔍 Obtendo detalhes do arquivo: ${fileId}`);
      const fileDetails = await drive.files.get({
        fileId: fileId,
        fields: 'id, name, mimeType, createdTime, size, parents',
      });

      const file = fileDetails.data;
      console.log('📄 Detalhes do arquivo:', {
        nome: file.name,
        tipo: file.mimeType,
        tamanho: file.size,
      });

      // Verificar se é um arquivo de vídeo
      const isVideo =
        file.mimeType.includes('video') ||
        file.name.toLowerCase().endsWith('.mp4') ||
        file.name.toLowerCase().endsWith('.avi') ||
        file.name.toLowerCase().endsWith('.mov') ||
        file.name.toLowerCase().endsWith('.wmv') ||
        file.name.toLowerCase().endsWith('.mkv');

      if (!isVideo) {
        console.log(`⚠️ Arquivo ${file.name} não é um vídeo válido`);
        return res.status(400).json({
          success: false,
          error: 'O arquivo não é um vídeo válido',
        });
      }

      console.log(`📄 Arquivo de vídeo encontrado: ${file.name}`);

      // Faz download do arquivo
      console.log(`⬇️ Iniciando download do arquivo: ${file.name}`);
      filePath = await driveService.downloadFile(fileId, file.name);
      console.log(`✅ Download concluído: ${filePath}`);

      // Usar o nome exato do arquivo como título (sem modificações)
      const videoTitle = file.name;

      // Formatar data para descrição
      const dataFormatada = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      // Metadados do vídeo para o YouTube
      const videoMetadata = {
        title: videoTitle,
        description: videoTitle, // Usar o nome do arquivo como descrição também
        tags: ['dinastia', 'automático'],
        privacyStatus: 'unlisted',
        // Configuração para "Não é para crianças"
        madeForKids: false,
        selfDeclaredMadeForKids: false,
      };

      console.log('🎬 Metadados do vídeo:', videoMetadata);

      // Faz upload para o YouTube
      // O tratamento de token inválido é feito internamente pelo youtubeService.uploadVideo
      console.log(`⬆️ Iniciando upload para o YouTube: ${videoMetadata.title}`);
      const youtubeResponse = await youtubeService.uploadVideo(
        filePath,
        videoMetadata,
      );

      console.log(`✅ Upload concluído. ID do YouTube: ${youtubeResponse.id}`);

      // Marca o arquivo como processado no banco de dados
      try {
        await fileRepository.markFileAsProcessed(fileId, {
          folderName: folderName || 'Sem Categoria',
          fileName: file.name,
          createdTime: file.createdTime,
          fileSize: file.size,
          youtubeId: youtubeResponse.id,
          youtubeUrl: `https://www.youtube.com/watch?v=${youtubeResponse.id}`,
          processedAt: new Date().toISOString(),
        });
        console.log('📝 Arquivo marcado como processado no banco de dados');
      } catch (dbError) {
        console.error('❌ Erro ao registrar no banco de dados:', dbError);
        // Continua mesmo com erro no banco de dados
      }

      console.log(`✅ Processamento concluído com sucesso para: ${file.name}`);

      // Retorna resposta de sucesso
      return res.status(200).json({
        success: true,
        message: 'Arquivo processado com sucesso',
        details: {
          fileName: file.name,
          youtubeId: youtubeResponse.id,
          youtubeUrl: `https://www.youtube.com/watch?v=${youtubeResponse.id}`,
        },
      });
    } catch (error) {
      console.error(`❌ Erro ao processar o arquivo ${fileId}:`, error);

      // Tratamento específico para erros de token
      if (
        error.message?.includes('invalid_token') ||
        error.message?.includes('Invalid Credentials') ||
        error.message?.includes('Token has been expired or revoked')
      ) {
        // Enviar notificação sobre o erro de token pelo Discord
        try {
          await sendDiscordErrorNotification(
            `⚠️ Erro de token ao processar arquivo: ${fileId}. O sistema tentará renovar automaticamente o token na próxima requisição.`,
          );
        } catch (notifyError) {
          console.error('❌ Erro ao enviar notificação:', notifyError);
        }

        return res.status(401).json({
          success: false,
          error: 'Token de autenticação inválido ou expirado',
          needsTokenRenewal: true,
        });
      }

      // Criar uma mensagem de erro mais amigável
      let errorMessage = 'Erro interno ao processar o arquivo';

      if (error.message?.includes('invalid or empty video title')) {
        errorMessage = 'O título do vídeo é inválido ou está vazio';
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Responde com erro
      return res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  } catch (error) {
    console.error('❌ Erro geral no webhook:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno no servidor',
    });
  } finally {
    // Limpar arquivos temporários somente após todo o processamento
    // e SOMENTE se tivermos um caminho de arquivo válido
    if (filePath) {
      try {
        console.log(`🧹 Removendo arquivo temporário: ${filePath}`);
        await fileUtils.removeFile(filePath);
        console.log('✅ Arquivo temporário removido com sucesso');
      } catch (cleanupError) {
        console.warn('⚠️ Erro ao remover arquivo temporário:', cleanupError);
        // Não falha por erro de limpeza
      }
    }
  }
}

/**
 * Endpoint de status/health check da funcionalidade
 * @param {Object} req - Request HTTP
 * @param {Object} res - Response HTTP
 */
export async function webhookStatus(req, res) {
  try {
    // Verifica se os serviços necessários estão disponíveis
    const driveOk = await checkDriveService();
    const youtubeOk = await checkYoutubeService();

    return res.status(200).json({
      status: 'online',
      services: {
        drive: driveOk ? 'connected' : 'error',
        youtube: youtubeOk ? 'connected' : 'error',
      },
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  } catch (error) {
    console.error('❌ Erro no health check:', error);
    return res.status(500).json({
      status: 'error',
      error: error.message,
    });
  }
}

/**
 * Endpoint para renovar manualmente o token do YouTube
 * @param {Object} req - Request HTTP
 * @param {Object} res - Response HTTP
 */
export async function renewYoutubeToken(req, res) {
  try {
    console.log('🔄 Solicitação de renovação manual de token recebida');

    // Verifica autenticação (opcional, implemente conforme necessário)
    // if (!req.headers.authorization) {
    //   return res.status(401).json({ success: false, error: 'Não autorizado' });
    // }

    // Inicia a renovação do token
    console.log('🔑 Iniciando renovação do token YouTube...');

    // Só devolve a resposta HTTP agora, pois o processo de renovação é interativo
    res.status(202).json({
      success: true,
      message: 'Renovação de token iniciada. Verifique o console do servidor.',
    });

    // Executa a renovação (processo interativo que requer inputs do console)
    await youtubeService.renewTokenManually();
  } catch (error) {
    console.error('❌ Erro ao renovar token:', error);

    // Se a resposta ainda não foi enviada
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Erro interno ao renovar token',
      });
    }
  }
}

/**
 * Verifica a conexão com o serviço do Drive
 * @returns {Promise<boolean>} Status da conexão
 */
async function checkDriveService() {
  try {
    const drive = await driveService.initDriveClient();
    await drive.about.get({ fields: 'user' });
    return true;
  } catch (error) {
    console.error('Erro ao verificar serviço do Drive:', error);
    return false;
  }
}

/**
 * Verifica a conexão com o serviço do YouTube
 * @returns {Promise<boolean>} Status da conexão
 */
async function checkYoutubeService() {
  try {
    const youtube = await youtubeService.initYoutubeClient();
    await youtube.channels.list({
      part: 'snippet',
      mine: true,
    });
    return true;
  } catch (error) {
    console.error('Erro ao verificar serviço do YouTube:', error);
    return false;
  }
}

/**
 * Envia uma notificação de erro via Discord
 * @param {string} message - Mensagem de erro
 * @returns {Promise<void>}
 */
async function sendDiscordErrorNotification(message) {
  try {
    // Escolhe um webhook apropriado para notificações de sistema
    const webhookUrl = config.WEBHOOKS.SUPPORT_RANKING_WEBHOOK;

    if (!webhookUrl) {
      console.warn('⚠️ URL de webhook não configurada para notificações');
      return;
    }

    const payload = {
      embeds: [
        {
          title: '⚠️ Alerta do Sistema YouTube',
          description: message,
          color: 16711680, // Vermelho
          timestamp: new Date().toISOString(),
          footer: {
            text: 'Sistema de upload automático DinastIA',
          },
        },
      ],
      username: 'Sistema DinastIA',
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Erro ao enviar notificação: ${response.status}`);
    }

    console.log('✅ Notificação de erro enviada para o Discord');
  } catch (error) {
    console.error('❌ Erro ao enviar notificação Discord:', error);
  }
}
