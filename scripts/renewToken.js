// scripts/renewToken.js
import { renewTokenManually } from '../services/youtubeService.js';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

/**
 * Script para renovar manualmente o token OAuth para o YouTube
 */
async function main() {
  console.log('🔑 Utilitário de renovação de token do YouTube');
  console.log('================================================\n');

  try {
    console.log('Iniciando processo de renovação...\n');
    await renewTokenManually();
    console.log('\n✅ Token renovado com sucesso!');
    console.log('O novo token foi salvo automaticamente no arquivo .env');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro durante o processo de renovação:');
    console.error(error);
    process.exit(1);
  }
}

// Executa o script
main();
