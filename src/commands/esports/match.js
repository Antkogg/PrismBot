import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { scheduleMatch, getUpcomingMatches } from '../../services/matchService.js';

export default {
    data: new SlashCommandBuilder()
        .setName('match')
        .setDescription('Manage esports matches and scrims')
        .addSubcommand(subcommand =>
            subcommand
                .setName('schedule')
                .setDescription('Schedule a new match or scrim')
                .addStringOption(option =>
                    option.setName('team')
                        .setDescription('Our team playing')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('opponent')
                        .setDescription('The opposing team')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('time')
                        .setDescription('Time of the match (e.g., Today 8PM EST)')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Type of match')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Scrim', value: 'Scrim' },
                            { name: 'Tournament', value: 'Tournament' },
                            { name: 'League', value: 'League' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('upcoming')
                .setDescription('View upcoming matches')),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'schedule') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.reply({ content: 'You do not have permission to schedule matches.', ephemeral: true });
            }
            const team = interaction.options.getString('team');
            const opponent = interaction.options.getString('opponent');
            const time = interaction.options.getString('time');
            const type = interaction.options.getString('type');
            
            const matchId = `${team}-${Date.now()}`;
            scheduleMatch(matchId, { team, opponent, time, type, status: 'upcoming' });
            
            const embed = new EmbedBuilder()
                .setTitle(`New ${type} Scheduled!`)
                .setColor('#00FF99')
                .addFields(
                    { name: 'Our Team', value: team, inline: true },
                    { name: 'Opponent', value: opponent, inline: true },
                    { name: 'Time', value: time, inline: false }
                )
                .setTimestamp();
            
            await interaction.reply({ content: '@here A new match has been scheduled!', embeds: [embed] });
        } else if (subcommand === 'upcoming') {
            const upcoming = getUpcomingMatches();
            
            const embed = new EmbedBuilder()
                .setTitle('Upcoming Matches')
                .setColor('#0099FF')
                .setTimestamp();
                
            if (upcoming.length === 0) {
                embed.setDescription('There are currently no upcoming matches scheduled.');
            } else {
                upcoming.forEach(match => {
                    embed.addFields({
                        name: `${match.team} vs ${match.opponent} (${match.type})`,
                        value: `Time: ${match.time}`
                    });
                });
            }
            
            await interaction.reply({ embeds: [embed] });
        }
    },
};
