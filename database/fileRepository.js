// database/fileRepository.js
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config/config.js';

// Arquivo de banco de dados
const DB_FILE = path.join(config.PATHS.DATABASE, 'processed-files.json');

/**
 * Inicializa o banco de dados
 */
function initDatabase() {
  try {
    // Cria o diretório se não existir
    if (!fs.existsSync(config.PATHS.DATABASE)) {
      fs.mkdirSync(config.PATHS.DATABASE, { recursive: true });
    }

    // Cria o arquivo se não existir
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify({}));
    }
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
    throw error;
  }
}

/**
 * Verifica se um arquivo já foi processado
 * @param {string} fileId - ID do arquivo
 * @returns {Promise<boolean>} Indica se o arquivo já foi processado
 */
export async function isFileProcessed(fileId) {
  try {
    initDatabase();
    const data = JSON.parse(fs.readFileSync(DB_FILE));
    return !!data[fileId];
  } catch (error) {
    console.error('Erro ao verificar arquivo processado:', error);
    return false; // Em caso de erro, assume que não foi processado
  }
}

/**
 * Marca um arquivo como processado
 * @param {string} fileId - ID do arquivo
 * @param {Object} metadata - Metadados do processamento
 */
export async function markFileAsProcessed(fileId, metadata) {
  try {
    initDatabase();

    const data = JSON.parse(fs.readFileSync(DB_FILE));

    data[fileId] = {
      ...metadata,
      processedAt: new Date().toISOString(),
    };

    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Erro ao marcar arquivo como processado:', error);
    throw error;
  }
}

/**
 * Obtém todos os arquivos processados
 * @returns {Promise<Object>} Mapa de arquivos processados
 */
export async function getAllProcessedFiles() {
  try {
    initDatabase();
    return JSON.parse(fs.readFileSync(DB_FILE));
  } catch (error) {
    console.error('Erro ao obter arquivos processados:', error);
    return {};
  }
}
