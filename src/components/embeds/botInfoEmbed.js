import { createBaseEmbed } from './baseEmbed.js';
import botConfig from '../../config/botConfig.js';
import colors from '../../config/colors.js';

/**
 * Creates an embed for bot info
 * @param {import('discord.js').Client} client 
 * @returns {import('discord.js').EmbedBuilder}
 */
export const createBotInfoEmbed = (client) => {
    return createBaseEmbed()
        .setColor(colors.PrismBlue)
        .setTitle(`${botConfig.name} - Bot Information`)
        .setDescription(`Official bot for **${botConfig.organization}**.`)
        .addFields(
            { name: 'Version', value: botConfig.version, inline: true },
            { name: 'Latency', value: `${Math.round(client.ws.ping)}ms`, inline: true },
            { name: 'Servers', value: `${client.guilds.cache.size}`, inline: true }
        );
};
