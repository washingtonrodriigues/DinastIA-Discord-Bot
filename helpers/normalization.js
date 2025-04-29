/**
 * Utilitários para normalização de nomes de usuário e canais
 * @module utils/normalization
 */

/**
 * Normaliza um nome de usuário para uso em nomes de canais
 * Removing trailing periods, special characters, and converting to lowercase
 *
 * @param {string} username - O nome de usuário a ser normalizado
 * @returns {string} Nome de usuário normalizado
 */
export function normalizeUsername(username) {
  if (!username) return '';

  return username
    .replace(/\.$/, '')
    .replace(/[^\w-]/g, '')
    .toLowerCase();
}

/**
 * Verifica se um username e nome de canal correspondem após normalização
 *
 * @param {string} username - Nome de usuário
 * @param {string} channelName - Nome do canal
 * @returns {boolean} true se correspondem após normalização
 */
export function isMatchingChannel(username, channelName) {
  if (!username || !channelName) return false;

  const normalizedUsername = normalizeUsername(username);
  const normalizedChannelName = normalizeUsername(channelName);

  return (
    normalizedUsername === normalizedChannelName || username === channelName
  );
}

/**
 * Cria um nome de canal seguro baseado no username
 *
 * @param {string} username - Nome de usuário original
 * @returns {string} Nome de canal seguro
 */
export function createSafeChannelName(username) {
  return normalizeUsername(username);
}

/**
 * Registra informações de normalização para debug
 *
 * @param {string} username - Nome de usuário original
 * @param {string} channelName - Nome do canal
 */
export function logNormalization(username, channelName) {
  const normalizedUsername = normalizeUsername(username);
  const normalizedChannelName = normalizeUsername(channelName);

  console.log(`Normalization info:
    Original username: "${username}"
    Normalized username: "${normalizedUsername}"
    Channel name: "${channelName}"
    Normalized channel name: "${normalizedChannelName}"
    Match: ${normalizedUsername === normalizedChannelName ? 'Yes ✅' : 'No ❌'}
    `);
}
