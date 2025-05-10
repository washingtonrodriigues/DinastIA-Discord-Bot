// services/driveService.js
import { google } from 'googleapis';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config/config.js';

/**
 * Inicializa o cliente do Google Drive
 * @returns {Promise<Object>} Cliente autenticado do Drive
 */
export async function initDriveClient() {
  try {
    // Logs de diagnóstico
    console.log('🔍 Verificando credenciais OAuth...');
    console.log('OAUTH_CREDENTIALS definido?', !!config.OAUTH.CREDENTIALS);
    console.log('YOUTUBE_OAUTH_TOKEN definido?', !!config.OAUTH.TOKEN);

    // Verifica se temos credenciais no ambiente
    if (!config.OAUTH.CREDENTIALS) {
      throw new Error(
        'Credenciais OAuth não encontradas no ambiente (OAUTH_CREDENTIALS)',
      );
    }

    // Tenta fazer o parse das credenciais
    let credentials;
    try {
      credentials = JSON.parse(config.OAUTH.CREDENTIALS);
      console.log('✅ Credenciais OAuth analisadas com sucesso');
    } catch (parseError) {
      console.error('❌ Erro ao analisar credenciais OAuth:', parseError);
      console.log(
        'Conteúdo da variável OAUTH_CREDENTIALS:',
        config.OAUTH.CREDENTIALS,
      );
      throw new Error(
        'Falha ao analisar credenciais OAuth. Verifique o formato JSON.',
      );
    }

    // Verifica se as credenciais têm a estrutura esperada
    if (!credentials.installed && !credentials.web) {
      console.error(
        '❌ Formato de credenciais inválido. Conteúdo:',
        credentials,
      );
      throw new Error(
        'Formato de credenciais OAuth inválido. Faltam propriedades "installed" ou "web".',
      );
    }

    // Configura o cliente OAuth
    const { client_secret, client_id, redirect_uris } =
      credentials.installed || credentials.web;

    console.log('📄 Usando client_id:', `${client_id.substring(0, 10)}...`);

    const auth = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0] || 'http://localhost:3000',
    );

    // Verifica se temos um token
    if (config.OAUTH.TOKEN) {
      // Tenta fazer o parse do token
      let token;
      try {
        token = JSON.parse(config.OAUTH.TOKEN);
        console.log('✅ Token OAuth analisado com sucesso');
      } catch (parseError) {
        console.error('❌ Erro ao analisar token OAuth:', parseError);
        console.log(
          'Conteúdo da variável YOUTUBE_OAUTH_TOKEN:',
          config.OAUTH.TOKEN,
        );
        throw new Error(
          'Falha ao analisar token OAuth. Verifique o formato JSON.',
        );
      }

      auth.setCredentials(token);
      try {
        console.log('🔍 Verificando informações do token...');
        const tokenInfo = await auth.getTokenInfo(token.access_token);
        console.log('✅ Token válido. Escopos:', tokenInfo.scopes);
        console.log('📧 Conta autenticada:', tokenInfo.email);
        console.log(
          '⏰ Expira em:',
          new Date(tokenInfo.expiry_date).toLocaleString(),
        );

        // Verificar se o escopo do Drive está incluído
        const hasDriveScope = tokenInfo.scopes.some(
          (scope) =>
            scope.includes('drive') ||
            scope.includes('https://www.googleapis.com/auth/drive'),
        );

        if (!hasDriveScope) {
          console.error(
            '❌ Token não possui escopo para acessar o Google Drive!',
          );
          console.error(
            'Escopos necessários: https://www.googleapis.com/auth/drive.readonly',
          );
          throw new Error(
            'Escopos insuficientes no token. Renove o token com os escopos corretos.',
          );
        }
      } catch (error) {
        console.error('❌ Erro ao verificar token:', error);
      }
      console.log('✅ Cliente do Drive inicializado com sucesso!');
      return google.drive({ version: 'v3', auth });
    }

    throw new Error(
      'Token OAuth não encontrado. Execute o script de autenticação do YouTube primeiro.',
    );
  } catch (error) {
    console.error('Erro ao inicializar cliente do Drive:', error);
    throw error;
  }
}

/**
 * Lista arquivos de vídeo em uma pasta específica
 * @param {string} folderId - ID da pasta no Drive
 * @returns {Promise<Array>} Lista de arquivos de vídeo
 */
export async function listVideoFiles(folderId) {
  try {
    const drive = await initDriveClient();

    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, createdTime, size)',
    });

    // Filtra apenas arquivos de vídeo
    return response.data.files.filter(
      (file) =>
        file.mimeType.includes('video') ||
        file.name.toLowerCase().endsWith('.mp4') ||
        file.name.toLowerCase().endsWith('.avi') ||
        file.name.toLowerCase().endsWith('.mov') ||
        file.name.toLowerCase().endsWith('.wmv'),
    );
  } catch (error) {
    console.error(`Erro ao listar arquivos da pasta ${folderId}:`, error);
    throw error;
  }
}

/**
 * Faz download de um arquivo do Drive
 * @param {string} fileId - ID do arquivo
 * @param {string} fileName - Nome do arquivo
 * @returns {Promise<string>} Caminho do arquivo local
 */
export async function downloadFile(fileId, fileName) {
  try {
    const drive = await initDriveClient();

    // Sanitiza o nome do arquivo para evitar problemas com caracteres especiais
    const sanitizedFileName = fileName.replace(/[\/\\:*?"<>|]/g, '_');

    // Cria diretório temporário se não existir
    if (!fs.existsSync(config.PATHS.TEMP)) {
      fs.mkdirSync(config.PATHS.TEMP, { recursive: true });
    }

    const filePath = path.join(config.PATHS.TEMP, sanitizedFileName);
    const dest = fs.createWriteStream(filePath);

    console.log(`⬇️ Baixando arquivo: ${fileName}`);
    console.log(`   Destino: ${filePath}`);

    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' },
    );

    await new Promise((resolve, reject) => {
      response.data
        .on('end', () => {
          console.log(`✅ Download completo: ${fileName}`);
          resolve();
        })
        .on('error', (err) => {
          console.error(`❌ Erro durante o download: ${err}`);
          reject(err);
        })
        .pipe(dest);
    });

    return filePath;
  } catch (error) {
    console.error(`Erro ao baixar arquivo ${fileName}:`, error);
    throw error;
  }
}
