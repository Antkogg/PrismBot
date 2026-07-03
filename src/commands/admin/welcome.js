import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { getWelcomeLogo, setWelcomeLogo, removeWelcomeLogo } from '../../repositories/welcomeRepository.js';
import { buildWelcomeEmbed, buildWelcomeComponents, buildLeaveEmbed } from '../../components/embeds/welcomeEmbed.js';
import logger from '../../utils/logger.js';

const WELCOME_CHANNEL_ID = '1520243844288086076';

export default {
    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('Manage the Opalescent Welcome System')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('setlogo')
                .setDescription('Set the logo image for welcome and leave embeds')
                .addAttachmentOption(option => 
                    option.setName('image')
                        .setDescription('The logo or banner image to upload')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('removelogo')
                .setDescription('Remove the currently saved logo image')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('preview')
                .setDescription('Preview the welcome embed ephemerally')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('test')
                .setDescription('Send a test welcome message to the hardcoded welcome channel')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('previewleave')
                .setDescription('Preview the leave embed ephemerally')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('testleave')
                .setDescription('Send a test leave message to the hardcoded welcome channel')
        ),
        
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const logoUrl = getWelcomeLogo();

        if (subcommand === 'setlogo') {
            const attachment = interaction.options.getAttachment('image');
            
            // Check if it's an image
            if (!attachment.contentType?.startsWith('image/')) {
                return interaction.reply({ content: '❌ Please provide a valid image file.', flags: MessageFlags.Ephemeral });
            }

            setWelcomeLogo(attachment.url);
            logger.info(`[welcome] Logo updated by ${interaction.user.tag}`);
            return interaction.reply({ content: `✅ Successfully saved the new welcome logo!`, flags: MessageFlags.Ephemeral });
        }

        if (subcommand === 'removelogo') {
            removeWelcomeLogo();
            logger.info(`[welcome] Logo removed by ${interaction.user.tag}`);
            return interaction.reply({ content: '✅ Successfully removed the welcome logo!', flags: MessageFlags.Ephemeral });
        }

        if (subcommand === 'preview') {
            const embed = buildWelcomeEmbed(interaction.member, logoUrl);
            const components = buildWelcomeComponents();
            return interaction.reply({ 
                content: `<@${interaction.user.id}>`, 
                embeds: [embed], 
                components: [components],
                flags: MessageFlags.Ephemeral 
            });
        }

        if (subcommand === 'test') {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const channel = interaction.guild.channels.cache.get(WELCOME_CHANNEL_ID) || await interaction.guild.channels.fetch(WELCOME_CHANNEL_ID).catch(() => null);
            
            if (!channel) {
                return interaction.editReply({ content: `❌ Could not find channel with ID \`${WELCOME_CHANNEL_ID}\`.` });
            }

            const embed = buildWelcomeEmbed(interaction.member, logoUrl);
            const components = buildWelcomeComponents();
            
            try {
                await channel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [components] });
                return interaction.editReply({ content: `✅ Test welcome message sent to <#${WELCOME_CHANNEL_ID}>!` });
            } catch (err) {
                logger.error('[welcome] Failed to send test welcome message', err);
                return interaction.editReply({ content: `❌ Failed to send message to <#${WELCOME_CHANNEL_ID}>. Check my permissions (View Channel, Send Messages, Embed Links).` });
            }
        }

        if (subcommand === 'previewleave') {
            const embed = buildLeaveEmbed(interaction.member, logoUrl);
            return interaction.reply({ 
                embeds: [embed], 
                flags: MessageFlags.Ephemeral 
            });
        }

        if (subcommand === 'testleave') {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const channel = interaction.guild.channels.cache.get(WELCOME_CHANNEL_ID) || await interaction.guild.channels.fetch(WELCOME_CHANNEL_ID).catch(() => null);
            
            if (!channel) {
                return interaction.editReply({ content: `❌ Could not find channel with ID \`${WELCOME_CHANNEL_ID}\`.` });
            }

            const embed = buildLeaveEmbed(interaction.member, logoUrl);
            
            try {
                await channel.send({ embeds: [embed] });
                return interaction.editReply({ content: `✅ Test leave message sent to <#${WELCOME_CHANNEL_ID}>!` });
            } catch (err) {
                logger.error('[welcome] Failed to send test leave message', err);
                return interaction.editReply({ content: `❌ Failed to send message to <#${WELCOME_CHANNEL_ID}>. Check my permissions (View Channel, Send Messages, Embed Links).` });
            }
        }
    }
};
