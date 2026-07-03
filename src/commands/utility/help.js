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
        const utilityCommands = [];

        for (const [name, command] of commands) {
            // Check root command permissions
            const defaultPerms = command.data.default_member_permissions;
            if (defaultPerms && !memberPerms.has(defaultPerms.bitfield)) {
                continue; // Skip if user doesn't have the root permission
            }

            const description = command.data.description;
            utilityCommands.push(`**/${name}**\n${description}`);
        }

        if (utilityCommands.length > 0) {
            embed.addFields({ name: '🛠️ Utility', value: utilityCommands.join('\n\n') });
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
