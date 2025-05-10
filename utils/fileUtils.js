// utils/fileUtils.js
import fs from 'node:fs';

/**
 * Remove um arquivo
 * @param {string} filePath - Caminho do arquivo
 * @returns {Promise<void>}
 */
export async function removeFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Arquivo removido: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Erro ao remover arquivo ${filePath}:`, error);
    throw error;
  }
}

/**
 * Verifica e cria diretórios necessários
 */
export async function ensureDirectories() {
  try {
    // Importa a configuração
    const { config } = await import('../config/config.js');

    // Cria os diretórios necessários
    const directories = [config.PATHS.TEMP, config.PATHS.DATABASE];

    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Diretório criado: ${dir}`);
      }
    }

    // Verifica se temos credenciais OAuth no ambiente
    if (!config.OAUTH.CREDENTIALS) {
      console.warn(
        '⚠️ Credenciais OAuth não encontradas no ambiente (OAUTH_CREDENTIALS)',
      );
      console.warn(
        'Verifique se a variável de ambiente OAUTH_CREDENTIALS está configurada corretamente.',
      );
    }

    // Verifica se temos token OAuth no ambiente
    if (!config.OAUTH.TOKEN) {
      console.warn(
        '⚠️ Token OAuth não encontrado no ambiente (YOUTUBE_OAUTH_TOKEN)',
      );
      console.warn(
        'Você precisará autenticar-se ao executar o programa pela primeira vez.',
      );
    }
  } catch (error) {
    console.error('❌ Erro ao verificar diretórios:', error);
    throw error;
  }
}
