import { SlashCommandBuilder, ChannelType, PermissionFlagsBits, MessageFlags, EmbedBuilder } from 'discord.js';
import {
    getGuildSettings,
    upsertGuildSettings,
    deleteGuildSettings,
    getTempChannel,
    getTempChannelByOwner,
    updateTempChannel,
    destroyTempVc,
    syncChannelPermissions,
    permitUser,
    unpermitUser,
    rejectUser,
    isOwnerOrAdmin,
    deleteAllTempChannelsForGuild
} from '../../services/vcService.js';
import { buildPanelEmbed, buildPanelButtons, buildInfoEmbed } from '../../components/vc/vcPanel.js';
import { buildRenameModal, buildLimitModal } from '../../components/vc/vcModals.js';
import { hasManageChannels } from '../../utils/permissions.js';

export default {
    data: new SlashCommandBuilder()
        .setName('vc')
        .setDescription('VC Rooms - Temporary Voice Channels')
        // Admin commands
        .addSubcommand(sub => sub.setName('setup').setDescription('Create or configure the Join to Create channel').addChannelOption(opt => opt.setName('category').setDescription('Optional category to use instead of creating one').addChannelTypes(ChannelType.GuildCategory)))
        .addSubcommand(sub => sub.setName('reset').setDescription('Delete the VC Rooms setup and all active channels'))
        .addSubcommand(sub => sub.setName('settings').setDescription('View or edit guild VC Room defaults').addStringOption(opt => opt.setName('template').setDescription('Default name template')).addIntegerOption(opt => opt.setName('limit').setDescription('Default user limit (0 = unlimited)').setMinValue(0).setMaxValue(99)))
        // User commands
        .addSubcommand(sub => sub.setName('panel').setDescription('Show the button control panel'))
        .addSubcommand(sub => sub.setName('info').setDescription('Show detailed info about the current temp VC'))
        .addSubcommand(sub => sub.setName('claim').setDescription('Claim ownership if the owner has left'))
        .addSubcommand(sub => sub.setName('lock').setDescription('Deny @everyone connect permission'))
        .addSubcommand(sub => sub.setName('unlock').setDescription('Restore @everyone connect permission'))
        .addSubcommand(sub => sub.setName('hide').setDescription('Deny @everyone view channel permission'))
        .addSubcommand(sub => sub.setName('show').setDescription('Restore @everyone view channel permission'))
        .addSubcommand(sub => sub.setName('rename').setDescription('Rename the temp VC').addStringOption(opt => opt.setName('name').setDescription('New name').setRequired(true)))
        .addSubcommand(sub => sub.setName('limit').setDescription('Set user limit (0 = unlimited)').addIntegerOption(opt => opt.setName('count').setDescription('Limit').setRequired(true).setMinValue(0).setMaxValue(99)))
        .addSubcommand(sub => sub.setName('permit').setDescription('Allow a user to join').addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true)))
        .addSubcommand(sub => sub.setName('unpermit').setDescription('Remove a user\'s permit').addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true)))
        .addSubcommand(sub => sub.setName('reject').setDescription('Deny a user connect permission, and disconnect them').addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true)))
        .addSubcommand(sub => sub.setName('transfer').setDescription('Transfer ownership to another user inside the VC').addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true)))
        .addSubcommand(sub => sub.setName('invite').setDescription('Permit a user and send them an invite').addUserOption(opt => opt.setName('user').setDescription('User').setRequired(true)))
        .addSubcommand(sub => sub.setName('delete').setDescription('Delete the temp VC immediately'))
        .addSubcommand(sub => sub.setName('help').setDescription('Show the VC Rooms help guide')),
        
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const guild = interaction.guild;
        const member = interaction.member;

        // ── Help Command ──────────────────────────────────────────────────────
        if (sub === 'help') {
            const settings = getGuildSettings(guild.id);
            const setupNote = settings ? '' : '\n\n*Note: VC Rooms has not been set up in this server yet. An admin can run `/vc setup` to enable it.*';

            const embeds = [
                new EmbedBuilder()
                    .setTitle('VC Rooms Help')
                    .setDescription('VC Rooms lets members create temporary voice channels by joining the Join to Create channel. Room owners can lock, hide, rename, limit, invite, reject, transfer, or delete their room.' + setupNote)
                    .setColor('#7B2FBE')
                    .addFields(
                        { name: 'Getting Started', value: '• Join the Join to Create voice channel to create your own temporary VC.\n• The bot will move you into your new room.\n• You become the room owner.\n• Your room deletes automatically when empty.\n• Use `/vc panel` to manage your room with buttons.\n• Use `/vc help` anytime to see every command.' },
                        { name: '1. `/vc help`', value: 'Shows this help guide.\n*Who can use it:* Everyone.' },
                        { name: '2. `/vc panel`', value: 'Opens your VC Room control panel with buttons for lock, unlock, hide, show, rename, limit, permit, reject, transfer, claim, and delete.\n*Who can use it:* Temp VC owners and admins.' },
                        { name: '3. `/vc info`', value: 'Shows information about the temp VC you are currently in, including owner, status, visibility, user limit, created time, permitted users, and rejected users.\n*Who can use it:* Everyone inside a temp VC.' }
                    )
                    .setFooter({ text: 'Page 1 of 5 • VC Rooms' }),
                    
                new EmbedBuilder()
                    .setTitle('Basic Room Controls')
                    .setColor('#7B2FBE')
                    .addFields(
                        { name: '1. `/vc lock`', value: 'Locks your temp VC so new users cannot join.\n*Who can use it:* Room owner or admin.\n*Example:* `/vc lock`' },
                        { name: '2. `/vc unlock`', value: 'Unlocks your temp VC so users can join again.\n*Who can use it:* Room owner or admin.\n*Example:* `/vc unlock`' },
                        { name: '3. `/vc hide`', value: 'Hides your temp VC from normal users and prevents new users from joining.\n*Who can use it:* Room owner or admin.\n*Example:* `/vc hide`' },
                        { name: '4. `/vc show`', value: 'Makes your temp VC visible again.\n*Who can use it:* Room owner or admin.\n*Example:* `/vc show`' },
                        { name: '5. `/vc rename`', value: 'Renames your temp VC.\n*Who can use it:* Room owner or admin.\n*Example:* `/vc rename name: Scrim Room`\n*Notes:* Block mass mentions like @everyone and @here.' },
                        { name: '6. `/vc limit`', value: 'Sets the user limit for your temp VC. Use 0 for no limit.\n*Who can use it:* Room owner or admin.\n*Example:* `/vc limit count: 6`' }
                    )
                    .setFooter({ text: 'Page 2 of 5 • VC Rooms' }),
                    
                new EmbedBuilder()
                    .setTitle('User Access Controls')
                    .setColor('#7B2FBE')
                    .addFields(
                        { name: '1. `/vc permit`', value: 'Allows a specific user to see and join your temp VC, even if it is locked or hidden.\n*Who can use it:* Room owner or admin.\n*Example:* `/vc permit user: @User`' },
                        { name: '2. `/vc unpermit`', value: 'Removes a user’s special access to your temp VC.\n*Who can use it:* Room owner or admin.\n*Example:* `/vc unpermit user: @User`' },
                        { name: '3. `/vc reject`', value: 'Removes a user from your temp VC and blocks them from joining again.\n*Who can use it:* Room owner or admin.\n*Example:* `/vc reject user: @User`' },
                        { name: '4. `/vc invite`', value: 'Gives a user access to your temp VC and sends them an invite message if possible.\n*Who can use it:* Room owner or admin.\n*Example:* `/vc invite user: @User`' }
                    )
                    .setFooter({ text: 'Page 3 of 5 • VC Rooms' }),
                    
                new EmbedBuilder()
                    .setTitle('Ownership Controls')
                    .setColor('#7B2FBE')
                    .addFields(
                        { name: '1. `/vc transfer`', value: 'Transfers ownership of your temp VC to another user currently inside the room.\n*Who can use it:* Room owner or admin.\n*Requirement:* The target user must be inside the temp VC.\n*Example:* `/vc transfer user: @User`' },
                        { name: '2. `/vc claim`', value: 'Claims ownership of a temp VC if the original owner has left.\n*Who can use it:* Users inside the temp VC.\n*Requirement:* The current owner must not be inside the room.\n*Example:* `/vc claim`' },
                        { name: '3. `/vc delete`', value: 'Deletes your temp VC immediately.\n*Who can use it:* Room owner or admin.\n*Example:* `/vc delete`' }
                    )
                    .setFooter({ text: 'Page 4 of 5 • VC Rooms' }),
                    
                new EmbedBuilder()
                    .setTitle('Admin Setup')
                    .setColor('#7B2FBE')
                    .addFields(
                        { name: '1. `/vc setup`', value: 'Creates or configures the VC Rooms system for the server.\n*Who can use it:* Users with Administrator or Manage Channels.\n*Result:* Creates or saves the Join to Create voice channel and VC Rooms category.\n*Example:* `/vc setup`' },
                        { name: '2. `/vc reset`', value: 'Resets the server’s VC Rooms setup and removes saved VC settings.\n*Who can use it:* Users with Administrator or Manage Channels.\n*Warning:* This should not delete unrelated server channels.\n*Example:* `/vc reset`' },
                        { name: '3. `/vc settings`', value: 'Shows the current VC Rooms server configuration, including category, Join to Create channel, default name template, default limit, and interface status.\n*Who can use it:* Users with Administrator or Manage Channels.\n*Example:* `/vc settings`' }
                    )
                    .setFooter({ text: 'Page 5 of 5 • VC Rooms' })
            ];
            
            return interaction.reply({ embeds, flags: MessageFlags.Ephemeral });
        }

        // ── Admin Commands ────────────────────────────────────────────────────
        if (['setup', 'reset', 'settings'].includes(sub)) {
            if (!hasManageChannels(member)) {
                return interaction.reply({ content: '❌ You need Manage Channels permission to use admin commands.', flags: MessageFlags.Ephemeral });
            }

            if (sub === 'setup') {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                let catOption = interaction.options.getChannel('category');
                
                if (!catOption) {
                    catOption = await guild.channels.create({ name: 'VC Rooms', type: ChannelType.GuildCategory });
                }
                
                const jtc = await guild.channels.create({
                    name: '➕ Join to Create',
                    type: ChannelType.GuildVoice,
                    parent: catOption.id,
                    permissionOverwrites: [{ id: guild.roles.everyone.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect] }],
                });
                
                upsertGuildSettings({
                    guild_id: guild.id,
                    category_id: catOption.id,
                    join_channel_id: jtc.id,
                });
                
                return interaction.editReply(`✅ VC Rooms setup complete.\nCategory: <#${catOption.id}>\nJoin Channel: <#${jtc.id}>`);
            }
            
            if (sub === 'reset') {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                const settings = getGuildSettings(guild.id);
                if (settings) {
                    // Try to delete JTC
                    if (settings.join_channel_id) {
                        const jtc = guild.channels.cache.get(settings.join_channel_id);
                        if (jtc) await jtc.delete().catch(()=>null);
                    }
                    deleteAllTempChannelsForGuild(guild.id);
                    deleteGuildSettings(guild.id);
                }
                return interaction.editReply('✅ VC Rooms reset. All temp channels will be ignored/deleted.');
            }
            
            if (sub === 'settings') {
                const settings = getGuildSettings(guild.id);
                if (!settings) return interaction.reply({ content: '❌ Run `/vc setup` first.', flags: MessageFlags.Ephemeral });
                
                const tmpl = interaction.options.getString('template');
                const limit = interaction.options.getInteger('limit');
                
                if (tmpl !== null || limit !== null) {
                    upsertGuildSettings({
                        guild_id: guild.id,
                        default_name_template: tmpl ?? settings.default_name_template,
                        default_user_limit: limit ?? settings.default_user_limit,
                    });
                    return interaction.reply({ content: '✅ Settings updated.', flags: MessageFlags.Ephemeral });
                }
                return interaction.reply({ content: `**Current Settings**\nTemplate: \`${settings.default_name_template}\`\nLimit: \`${settings.default_user_limit}\``, flags: MessageFlags.Ephemeral });
            }
        }

        // ── User Commands ────────────────────────────────────────────────────
        
        // Find channel: if user is in a VC, use that (if it's a temp VC)
        // Alternatively, if they own a VC, we can use that.
        // For simplicity, we require them to be in the temp VC.
        const channelId = member.voice?.channelId;
        if (!channelId) {
            return interaction.reply({ content: '❌ You are not in a voice channel. Join one first.', flags: MessageFlags.Ephemeral });
        }
        
        const tempRow = getTempChannel(channelId);
        if (!tempRow) {
            return interaction.reply({ content: '❌ You are not in a temporary VC.', flags: MessageFlags.Ephemeral });
        }
        
        const channel = guild.channels.cache.get(channelId);
        if (!channel) return interaction.reply({ content: '❌ Channel error.', flags: MessageFlags.Ephemeral });

        // Claim doesn't need owner check
        if (sub === 'claim') {
            if (tempRow.owner_id === member.id) return interaction.reply({ content: '❌ You already own this voice channel.', flags: MessageFlags.Ephemeral });
            if (channel.members.has(tempRow.owner_id)) return interaction.reply({ content: '❌ The current owner is still in the channel.', flags: MessageFlags.Ephemeral });
            
            updateTempChannel(channelId, { owner_id: member.id });
            await syncChannelPermissions(channel, guild, getTempChannel(channelId));
            return interaction.reply({ content: '✅ You have claimed ownership of this voice channel.', flags: MessageFlags.Ephemeral });
        }
        
        // Everything else needs owner or admin
        if (!isOwnerOrAdmin(member, tempRow)) {
            return interaction.reply({ content: '❌ You must be the channel owner or an admin to use these controls.', flags: MessageFlags.Ephemeral });
        }

        // Action routing
        try {
            if (sub === 'panel') {
                return interaction.reply({ embeds: [buildPanelEmbed(channel, tempRow, guild)], components: buildPanelButtons(channelId), flags: MessageFlags.Ephemeral });
            }
            if (sub === 'info') {
                return interaction.reply({ embeds: [buildInfoEmbed(channel, tempRow)], flags: MessageFlags.Ephemeral });
            }
            
            let newRow = { ...tempRow };
            
            if (sub === 'lock') {
                updateTempChannel(channelId, { locked: 1 }); newRow.locked = 1;
                await syncChannelPermissions(channel, guild, newRow);
                return interaction.reply({ content: '✅ Channel locked.', flags: MessageFlags.Ephemeral });
            }
            if (sub === 'unlock') {
                updateTempChannel(channelId, { locked: 0 }); newRow.locked = 0;
                await syncChannelPermissions(channel, guild, newRow);
                return interaction.reply({ content: '✅ Channel unlocked.', flags: MessageFlags.Ephemeral });
            }
            if (sub === 'hide') {
                updateTempChannel(channelId, { hidden: 1 }); newRow.hidden = 1;
                await syncChannelPermissions(channel, guild, newRow);
                return interaction.reply({ content: '✅ Channel hidden.', flags: MessageFlags.Ephemeral });
            }
            if (sub === 'show') {
                updateTempChannel(channelId, { hidden: 0 }); newRow.hidden = 0;
                await syncChannelPermissions(channel, guild, newRow);
                return interaction.reply({ content: '✅ Channel visible.', flags: MessageFlags.Ephemeral });
            }
            
            if (sub === 'rename') {
                const name = interaction.options.getString('name');
                await channel.setName(name, `VC Rooms - renamed by ${member.user.tag}`);
                updateTempChannel(channelId, { name });
                return interaction.reply({ content: `✅ Renamed to **${name}**.`, flags: MessageFlags.Ephemeral });
            }
            if (sub === 'limit') {
                const count = interaction.options.getInteger('count');
                await channel.setUserLimit(count, `VC Rooms - limit changed by ${member.user.tag}`);
                updateTempChannel(channelId, { user_limit: count });
                return interaction.reply({ content: `✅ Limit set to **${count === 0 ? 'Unlimited' : count}**.`, flags: MessageFlags.Ephemeral });
            }
            
            if (sub === 'permit') {
                const target = interaction.options.getUser('user');
                await permitUser(channel, guild, target.id, tempRow);
                return interaction.reply({ content: `✅ <@${target.id}> permitted.`, flags: MessageFlags.Ephemeral });
            }
            if (sub === 'unpermit') {
                const target = interaction.options.getUser('user');
                await unpermitUser(channel, guild, target.id, tempRow);
                return interaction.reply({ content: `✅ <@${target.id}> permit removed.`, flags: MessageFlags.Ephemeral });
            }
            if (sub === 'reject') {
                const target = interaction.options.getUser('user');
                const targetMember = guild.members.cache.get(target.id) ?? await guild.members.fetch(target.id).catch(()=>null);
                if (targetMember) await rejectUser(channel, guild, targetMember, tempRow);
                return interaction.reply({ content: `✅ <@${target.id}> rejected.`, flags: MessageFlags.Ephemeral });
            }
            
            if (sub === 'transfer') {
                const target = interaction.options.getUser('user');
                const targetMember = guild.members.cache.get(target.id) ?? await guild.members.fetch(target.id).catch(()=>null);
                if (target.id === tempRow.owner_id) return interaction.reply({ content: '❌ They are already the owner.', flags: MessageFlags.Ephemeral });
                if (targetMember?.voice?.channelId !== channelId) return interaction.reply({ content: '❌ Target user must be inside the voice channel.', flags: MessageFlags.Ephemeral });
                updateTempChannel(channelId, { owner_id: target.id });
                await syncChannelPermissions(channel, guild, getTempChannel(channelId));
                return interaction.reply({ content: `✅ Ownership transferred to <@${target.id}>.`, flags: MessageFlags.Ephemeral });
            }
            
            if (sub === 'invite') {
                const target = interaction.options.getUser('user');
                await permitUser(channel, guild, target.id, tempRow);
                const invite = await channel.createInvite({ maxAge: 86400, maxUses: 1, reason: `VC Rooms invite` }).catch(()=>null);
                if (invite) {
                    await target.send(`You've been invited to join a VC Room by **${member.displayName}**!\n${invite.url}`).catch(()=>null);
                }
                return interaction.reply({ content: `✅ <@${target.id}> permitted and invited.`, flags: MessageFlags.Ephemeral });
            }
            
            if (sub === 'delete') {
                await destroyTempVc(channel, `VC Rooms - deleted by ${member.user.tag}`);
                return interaction.reply({ content: '✅ Channel deleted.', flags: MessageFlags.Ephemeral });
            }
            
        } catch (err) {
            return interaction.reply({ content: '❌ An error occurred.', flags: MessageFlags.Ephemeral });
        }
    },
};
