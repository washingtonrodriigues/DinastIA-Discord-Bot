import { EmbedBuilder } from 'discord.js';

/**
 * Cria o embed inicial de boas-vindas
 * @returns {EmbedBuilder} O embed construído
 */
function createWelcomeEmbed(
  title,
  description,
  fieldName,
  fieldValue,
  color,
  footerText,
  footerIcon,
  thumbnailUrl,
) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .addFields({
      name: fieldName,
      value: fieldValue,
    })
    .setFooter({
      text: footerText,
      iconURL: footerIcon,
    })
    .setColor(color)
    .setThumbnail(thumbnailUrl);
}

/**
 * Cria o embed de processamento
 * @returns {EmbedBuilder} O embed construído
 */
function createProcessingEmbed(title, description) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor('Yellow');
}

/**
 * Cria o embed de sucesso
 * @returns {EmbedBuilder} O embed construído
 */
function createSuccessEmbed(title, description) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor('Green');
}

/**
 * Cria o embed de erro
 * @returns {EmbedBuilder} O embed construído
 */
function createErrorEmbed(title, description) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor('Red');
}

export default {
  createWelcomeEmbed,
  createProcessingEmbed,
  createSuccessEmbed,
  createErrorEmbed,
};
