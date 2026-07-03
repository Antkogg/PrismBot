import {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    UserSelectMenuBuilder,
} from 'discord.js';
import { getChannelPermissions } from '../../repositories/vcRepository.js';

// ══════════════════════════════════════════════════════════════════════════════
// Panel Embed
// ══════════════════════════════════════════════════════════════════════════════

export const buildPanelEmbed = (channel, tempRow, guild) => {
    const perms     = getChannelPermissions(tempRow.channel_id);
    const permitted = perms.filter(p => p.permission_type === 'permit');
    const rejected  = perms.filter(p => p.permission_type === 'reject');

    const status     = tempRow.locked ? '🔒 Locked'  : '🔓 Unlocked';
    const visibility = tempRow.hidden ? '🫥 Hidden'  : '👁️ Visible';
    const limit      = tempRow.user_limit > 0 ? `${tempRow.user_limit} members` : 'Unlimited';
    const createdTs  = Math.floor(new Date(tempRow.created_at + 'Z').getTime() / 1000);

    return new EmbedBuilder()
        .setTitle('🎙️ VC Room Controls')
        .setColor('#7B2FBE')
        .addFields(
            { name: 'Channel',    value: `<#${tempRow.channel_id}>`, inline: true },
            { name: 'Owner',      value: `<@${tempRow.owner_id}>`,   inline: true },
            { name: '\u200b',     value: '\u200b',                   inline: true },
            { name: 'Status',     value: status,                     inline: true },
            { name: 'Visibility', value: visibility,                 inline: true },
            { name: 'Limit',      value: limit,                      inline: true },
            {
                name:  'Permitted Users',
                value: permitted.length ? permitted.map(p => `<@${p.user_id}>`).join(' ') : '_None_',
                inline: false,
            },
            {
                name:  'Rejected Users',
                value: rejected.length ? rejected.map(p => `<@${p.user_id}>`).join(' ') : '_None_',
                inline: false,
            },
            { name: 'Created', value: `<t:${createdTs}:R>`, inline: false },
        )
        .setFooter({ text: 'VC Rooms • Only the owner and admins can use these controls' });
};

export const buildInfoEmbed = (channel, tempRow) => {
    const perms     = getChannelPermissions(tempRow.channel_id);
    const permitted = perms.filter(p => p.permission_type === 'permit');
    const rejected  = perms.filter(p => p.permission_type === 'reject');
    const createdTs = Math.floor(new Date(tempRow.created_at + 'Z').getTime() / 1000);

    return new EmbedBuilder()
        .setTitle(`🎙️ VC Room Info — ${tempRow.name}`)
        .setColor('#7B2FBE')
        .addFields(
            { name: 'Channel',    value: `<#${tempRow.channel_id}>`,           inline: true },
            { name: 'Owner',      value: `<@${tempRow.owner_id}>`,             inline: true },
            { name: 'Members',    value: `${channel?.members?.size ?? 0}`,     inline: true },
            { name: 'Status',     value: tempRow.locked ? '🔒 Locked' : '🔓 Unlocked', inline: true },
            { name: 'Visibility', value: tempRow.hidden ? '🫥 Hidden' : '👁️ Visible',  inline: true },
            { name: 'Limit',      value: tempRow.user_limit > 0 ? `${tempRow.user_limit}` : 'Unlimited', inline: true },
            {
                name:  'Permitted',
                value: permitted.length ? permitted.map(p => `<@${p.user_id}>`).join(' ') : '_None_',
                inline: false,
            },
            {
                name:  'Rejected',
                value: rejected.length ? rejected.map(p => `<@${p.user_id}>`).join(' ') : '_None_',
                inline: false,
            },
            { name: 'Created', value: `<t:${createdTs}:F>`, inline: false },
        )
        .setFooter({ text: 'VC Rooms • Opalescent Prism Bot' });
};

// ══════════════════════════════════════════════════════════════════════════════
// Panel Buttons
// ══════════════════════════════════════════════════════════════════════════════

export const buildPanelButtons = (channelId) => {
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`vc_lock_${channelId}`)    .setLabel('Lock')    .setEmoji('🔒').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`vc_unlock_${channelId}`)  .setLabel('Unlock')  .setEmoji('🔓').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`vc_hide_${channelId}`)    .setLabel('Hide')    .setEmoji('🫥').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`vc_show_${channelId}`)    .setLabel('Show')    .setEmoji('👁️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`vc_claim_${channelId}`)   .setLabel('Claim')   .setEmoji('👑').setStyle(ButtonStyle.Primary),
    );
    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`vc_rename_${channelId}`)  .setLabel('Rename')  .setEmoji('✏️').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`vc_limit_${channelId}`)   .setLabel('Limit')   .setEmoji('🔢').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`vc_permit_${channelId}`)  .setLabel('Permit')  .setEmoji('✅').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`vc_reject_${channelId}`)  .setLabel('Reject')  .setEmoji('❌').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(`vc_transfer_${channelId}`).setLabel('Transfer').setEmoji('🔄').setStyle(ButtonStyle.Primary),
    );
    const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`vc_delete_${channelId}`).setLabel('Delete VC').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
    );
    return [row1, row2, row3];
};

// ══════════════════════════════════════════════════════════════════════════════
// User Select Rows  (for permit / reject / transfer / invite)
// ══════════════════════════════════════════════════════════════════════════════

export const buildUserSelectRow = (channelId, action) =>
    new ActionRowBuilder().addComponents(
        new UserSelectMenuBuilder()
            .setCustomId(`vc_${action}_select_${channelId}`)
            .setPlaceholder(`Select a user to ${action}`)
            .setMinValues(1)
            .setMaxValues(1),
    );
