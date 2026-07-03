import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { createLFG, removeLFG, getAllLFG } from '../../services/lfgService.js';

export default {
    data: new SlashCommandBuilder()
        .setName('lfg')
        .setDescription('Looking for Group system')
        .addSubcommand(subcommand =>
            subcommand
                .setName('post')
                .setDescription('Post that you are looking for a group')
                .addStringOption(option =>
                    option.setName('game')
                        .setDescription('The game you want to play')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('rank')
                        .setDescription('Your current rank/skill level')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Additional details (e.g., LF2M, chill runs)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove your active LFG post'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('browse')
                .setDescription('Browse active LFG posts')
                .addStringOption(option =>
                    option.setName('game')
                        .setDescription('Filter by game')
                        .setRequired(false))),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'post') {
            const game = interaction.options.getString('game');
            const rank = interaction.options.getString('rank');
            const description = interaction.options.getString('description') || 'None provided';
            
            createLFG(interaction.user.id, game, rank, description);
            
            await interaction.reply({ content: `Your LFG post for **${game}** has been created! Use \`/lfg remove\` when you find a group.`, ephemeral: true });
            
            // Optionally, we could also broadcast this to an LFG channel here if one was configured
            
        } else if (subcommand === 'remove') {
            const removed = removeLFG(interaction.user.id);
            
            if (removed) {
                await interaction.reply({ content: 'Your LFG post has been removed.', ephemeral: true });
            } else {
                await interaction.reply({ content: 'You do not have an active LFG post.', ephemeral: true });
            }
            
        } else if (subcommand === 'browse') {
            const gameFilter = interaction.options.getString('game');
            const listings = getAllLFG(gameFilter);
            
            const embed = new EmbedBuilder()
                .setTitle('Looking For Group')
                .setColor('#FF9900')
                .setTimestamp();
                
            if (gameFilter) {
                embed.setDescription(`Showing results for: **${gameFilter}**`);
            }
                
            if (listings.length === 0) {
                embed.addFields({ name: 'No listings', value: 'There are currently no players looking for a group.' });
            } else {
                listings.forEach(lfg => {
                    embed.addFields({
                        name: `${lfg.game} - ${lfg.rank}`,
                        value: `<@${lfg.userId}>: ${lfg.description}`
                    });
                });
            }
            
            await interaction.reply({ embeds: [embed] });
        }
    },
};
