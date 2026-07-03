import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('A simple test command to verify Northflank automatic deployment.'),
    async execute(interaction) {
        await interaction.reply('✅ The automatic update worked flawlessly! The new command was deployed and the bot restarted successfully!');
    },
};
