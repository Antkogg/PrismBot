import { SlashCommandBuilder } from 'discord.js';
import { createBotInfoEmbed } from '../../components/embeds/botInfoEmbed.js';
import logger from '../../utils/logger.js';

export default {
    data: new SlashCommandBuilder()
        .setName('bot-info')
        .setDescription('Displays information about the Prism bot.'),
    async execute(interaction) {
        logger.info(`Bot-info command executed by ${interaction.user.tag}`);
        
        const embed = createBotInfoEmbed(interaction.client);
        await interaction.reply({ embeds: [embed] });
    }
};
