import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { addPlayerToRoster, getRoster, removePlayerFromRoster } from '../../services/rosterService.js';

export default {
    data: new SlashCommandBuilder()
        .setName('roster')
        .setDescription('Manage the esports rosters')
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View the roster of a team')
                .addStringOption(option =>
                    option.setName('team')
                        .setDescription('The team to view')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a player to a team roster')
                .addStringOption(option =>
                    option.setName('team')
                        .setDescription('The team to add the player to')
                        .setRequired(true))
                .addUserOption(option =>
                    option.setName('player')
                        .setDescription('The player to add')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a player from a team roster')
                .addStringOption(option =>
                    option.setName('team')
                        .setDescription('The team to remove the player from')
                        .setRequired(true))
                .addUserOption(option =>
                    option.setName('player')
                        .setDescription('The player to remove')
                        .setRequired(true))),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const teamName = interaction.options.getString('team');

        if (subcommand === 'view') {
            const roster = getRoster(teamName);
            
            const embed = new EmbedBuilder()
                .setTitle(`Roster for ${teamName.toUpperCase()}`)
                .setColor('#FF0099')
                .setTimestamp();
            
            if (roster.length === 0) {
                embed.setDescription('This team currently has no players on its roster.');
            } else {
                embed.setDescription(roster.map(p => `<@${p}>`).join('\n'));
            }
            
            await interaction.reply({ embeds: [embed] });
        } else if (subcommand === 'add') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.reply({ content: 'You do not have permission to modify rosters.', ephemeral: true });
            }
            const player = interaction.options.getUser('player');
            const added = addPlayerToRoster(teamName, player.id);
            
            if (added) {
                await interaction.reply({ content: `Successfully added <@${player.id}> to the ${teamName} roster.`, ephemeral: true });
            } else {
                await interaction.reply({ content: `<@${player.id}> is already on the ${teamName} roster.`, ephemeral: true });
            }
        } else if (subcommand === 'remove') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.reply({ content: 'You do not have permission to modify rosters.', ephemeral: true });
            }
            const player = interaction.options.getUser('player');
            const removed = removePlayerFromRoster(teamName, player.id);
            
            if (removed) {
                await interaction.reply({ content: `Successfully removed <@${player.id}> from the ${teamName} roster.`, ephemeral: true });
            } else {
                await interaction.reply({ content: `<@${player.id}> was not found on the ${teamName} roster.`, ephemeral: true });
            }
        }
    },
};
