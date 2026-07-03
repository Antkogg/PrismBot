import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('List all available commands based on your permissions'),
    async execute(interaction) {
        const { commands } = interaction.client;
        const memberPerms = interaction.member.permissions;
        const isManager = memberPerms.has(PermissionFlagsBits.ManageGuild);

        const embed = new EmbedBuilder()
            .setTitle('Opalescent Prism - Command Guide')
            .setColor('#00FFFF')
            .setDescription('Here are the commands you have access to:')
            .setTimestamp();

        // Organize commands into categories for the embed
        const esportsCommands = [];
        const utilityCommands = [];

        for (const [name, command] of commands) {
            // Check root command permissions
            const defaultPerms = command.data.default_member_permissions;
            if (defaultPerms && !memberPerms.has(defaultPerms.bitfield)) {
                continue; // Skip if user doesn't have the root permission
            }

            let description = command.data.description;

            // Custom descriptions based on subcommands and permissions
            if (name === 'roster') {
                description = '`/roster view` - View a team roster\n';
                if (isManager) {
                    description += '`/roster add` - Add a player to a team (Manager)\n';
                    description += '`/roster remove` - Remove a player (Manager)';
                }
            } else if (name === 'match') {
                description = '`/match upcoming` - View upcoming matches\n';
                if (isManager) {
                    description += '`/match schedule` - Schedule a new match (Manager)';
                }
            } else if (name === 'lfg') {
                description = '`/lfg post` - Look for a group\n`/lfg browse` - Browse active groups\n`/lfg remove` - Remove your post';
            } else if (name === 'socials') {
                description = '`/socials track` - Track an account\n`/socials untrack` - Untrack an account\n`/socials list` - List tracked accounts';
            }

            // Simple bucketing based on command name (since we know the folder structure)
            if (['roster', 'match', 'lfg', 'socials'].includes(name)) {
                esportsCommands.push(`**/${name}**\n${description}`);
            } else {
                utilityCommands.push(`**/${name}**\n${description}`);
            }
        }

        if (esportsCommands.length > 0) {
            embed.addFields({ name: '🎮 Esports Features', value: esportsCommands.join('\n\n') });
        }
        if (utilityCommands.length > 0) {
            embed.addFields({ name: '🛠️ Utility', value: utilityCommands.join('\n\n') });
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
