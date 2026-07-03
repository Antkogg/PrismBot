import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { trackAccount, untrackAccount, getTrackedAccounts } from '../../services/socialMediaService.js';

export default {
    data: new SlashCommandBuilder()
        .setName('socials')
        .setDescription('Manage automated social media tracking')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('track')
                .setDescription('Add an account to be automatically tracked')
                .addStringOption(option =>
                    option.setName('platform')
                        .setDescription('The platform')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Twitter / X', value: 'Twitter' },
                            { name: 'YouTube', value: 'YouTube' },
                            { name: 'Twitch', value: 'Twitch' }
                        ))
                .addStringOption(option =>
                    option.setName('username')
                        .setDescription('The account username/handle to track')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('untrack')
                .setDescription('Stop tracking an account')
                .addStringOption(option =>
                    option.setName('platform')
                        .setDescription('The platform')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Twitter / X', value: 'Twitter' },
                            { name: 'YouTube', value: 'YouTube' },
                            { name: 'Twitch', value: 'Twitch' }
                        ))
                .addStringOption(option =>
                    option.setName('username')
                        .setDescription('The account username/handle to remove')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all currently tracked accounts')),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'track') {
            const platform = interaction.options.getString('platform');
            const username = interaction.options.getString('username');
            
            const success = trackAccount(platform, username);
            if (success) {
                await interaction.reply({ content: `✅ Now automatically tracking **${username}** on **${platform}**!`, ephemeral: true });
            } else {
                await interaction.reply({ content: `❌ Failed to track account. Invalid platform?`, ephemeral: true });
            }
        } else if (subcommand === 'untrack') {
            const platform = interaction.options.getString('platform');
            const username = interaction.options.getString('username');
            
            const success = untrackAccount(platform, username);
            if (success) {
                await interaction.reply({ content: `🛑 Stopped tracking **${username}** on **${platform}**.`, ephemeral: true });
            } else {
                await interaction.reply({ content: `❌ Could not find **${username}** in the tracked list for **${platform}**.`, ephemeral: true });
            }
        } else if (subcommand === 'list') {
            const accounts = getTrackedAccounts();
            
            const embed = new EmbedBuilder()
                .setTitle('Tracked Social Media Accounts')
                .setColor('#00FF99')
                .setTimestamp();
                
            let hasAny = false;
            for (const [platform, names] of Object.entries(accounts)) {
                if (names.length > 0) {
                    hasAny = true;
                    embed.addFields({ name: platform, value: names.join('\n') });
                }
            }
            
            if (!hasAny) {
                embed.setDescription('You are not currently tracking any accounts.\nUse `/socials track` to add some!');
            }
            
            await interaction.reply({ embeds: [embed] });
        }
    },
};
