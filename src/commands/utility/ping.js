import { SlashCommandBuilder } from 'discord.js';
import { createBaseEmbed } from '../../components/embeds/baseEmbed.js';
import logger from '../../utils/logger.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong and the bot latency.'),
    async execute(interaction) {
        logger.info(`Ping command executed by ${interaction.user.tag}`);
        
        const sent = await interaction.deferReply({ fetchReply: true });
        const latency = sent.createdTimestamp - interaction.createdTimestamp;

        const embed = createBaseEmbed()
            .setTitle('🏓 Pong!')
            .addFields(
                { name: 'Bot Latency', value: `${latency}ms`, inline: true },
                { name: 'API Latency', value: `${Math.round(interaction.client.ws.ping)}ms`, inline: true }
            );

        await interaction.editReply({ embeds: [embed] });
    }
};
