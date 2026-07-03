import { EmbedBuilder } from 'discord.js';
import colors from '../../config/colors.js';
import constants from '../../utils/constants.js';

/**
 * Creates a base embed with Opalescent branding
 * @returns {EmbedBuilder} A configured Discord EmbedBuilder
 */
export const createBaseEmbed = () => {
    return new EmbedBuilder()
        .setColor(colors.OpalCyan)
        .setTimestamp()
        .setFooter({ text: constants.EMBED_FOOTER_TEXT, iconURL: constants.EMBED_FOOTER_ICON });
};
