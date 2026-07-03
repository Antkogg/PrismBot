import { MessageFlags } from 'discord.js';
import logger from '../utils/logger.js';
import {
    getTempChannel,
    isOwnerOrAdmin,
    updateTempChannel,
    syncChannelPermissions,
    destroyTempVc,
    permitUser,
    rejectUser,
} from '../services/vcService.js';
import { buildPanelEmbed, buildPanelButtons, buildUserSelectRow, buildInfoEmbed } from '../components/vc/vcPanel.js';
import { buildRenameModal, buildLimitModal } from '../components/vc/vcModals.js';

export const handleVcInteraction = async (interaction) => {
    try {
        const isModal = interaction.isModalSubmit();
        const isButton = interaction.isButton();
        const isSelect = interaction.isUserSelectMenu();

        if (!isModal && !isButton && !isSelect) return false;

        const customId = interaction.customId;
        if (!customId || !customId.startsWith('vc_')) return false; // not a VC interaction

        // Parse action and channelId
        // e.g., vc_lock_12345, vc_rename_modal_12345, vc_permit_select_12345
        let action, channelId;
        if (isModal) {
            const parts = customId.split('_');
            action = parts[1]; // rename, limit
            channelId = parts[3];
        } else if (isSelect) {
            const parts = customId.split('_');
            action = parts[1]; // permit, reject, transfer, invite
            channelId = parts[3];
        } else {
            const parts = customId.split('_');
            action = parts[1]; // lock, unlock, hide, show, claim, rename, limit, permit, reject, transfer, delete
            channelId = parts[2];
        }

        const tempRow = getTempChannel(channelId);
        if (!tempRow) {
            await interaction.reply({ content: '❌ This temporary voice channel no longer exists in the database.', flags: MessageFlags.Ephemeral });
            return true;
        }

        // Fetch channel
        const channel = interaction.guild.channels.cache.get(channelId) ?? await interaction.guild.channels.fetch(channelId).catch(() => null);
        if (!channel) {
            await interaction.reply({ content: '❌ This channel no longer exists.', flags: MessageFlags.Ephemeral });
            return true;
        }

        const member = interaction.member;

        // ── Claim is special (must be inside VC, owner must NOT be inside) ──
        if (action === 'claim') {
            if (member.voice.channelId !== channelId) {
                await interaction.reply({ content: '❌ You must be inside the voice channel to claim it.', flags: MessageFlags.Ephemeral });
                return true;
            }
            if (tempRow.owner_id === member.id) {
                await interaction.reply({ content: '❌ You already own this voice channel.', flags: MessageFlags.Ephemeral });
                return true;
            }
            if (channel.members.has(tempRow.owner_id)) {
                await interaction.reply({ content: '❌ The current owner is still in the channel.', flags: MessageFlags.Ephemeral });
                return true;
            }
            updateTempChannel(channelId, { owner_id: member.id });
            const newRow = getTempChannel(channelId);
            await syncChannelPermissions(channel, interaction.guild, newRow);
            
            // update panel if this was a button click
            if (isButton && interaction.message) {
                const embed = buildPanelEmbed(channel, newRow, interaction.guild);
                await interaction.update({ embeds: [embed] }).catch(() => null);
            } else {
                await interaction.reply({ content: '✅ You have claimed ownership of this voice channel.', flags: MessageFlags.Ephemeral });
            }
            return true;
        }

        // ── All other actions require Owner or Admin ──
        if (!isOwnerOrAdmin(member, tempRow)) {
            await interaction.reply({ content: '❌ You must be the channel owner or an admin to use these controls.', flags: MessageFlags.Ephemeral });
            return true;
        }

        // ── Buttons that open Modals ──
        if (isButton && action === 'rename') {
            await interaction.showModal(buildRenameModal(channelId, tempRow.name));
            return true;
        }
        if (isButton && action === 'limit') {
            await interaction.showModal(buildLimitModal(channelId, tempRow.user_limit));
            return true;
        }

        // ── Buttons that open User Selects ──
        if (isButton && ['permit', 'reject', 'transfer', 'invite'].includes(action)) {
            await interaction.reply({
                content: `Select a user to ${action}:`,
                components: [buildUserSelectRow(channelId, action)],
                flags: MessageFlags.Ephemeral,
            });
            return true;
        }

        // ── Modal Submits ──
        if (isModal && action === 'rename') {
            const newName = interaction.fields.getTextInputValue('vc_rename_input');
            await channel.setName(newName, `VC Rooms - renamed by ${member.user.tag}`).catch(() => null);
            updateTempChannel(channelId, { name: newName });
            const newRow = getTempChannel(channelId);
            await interaction.update({ embeds: [buildPanelEmbed(channel, newRow, interaction.guild)], components: buildPanelButtons(channelId) }).catch(async () => {
                await interaction.reply({ content: `✅ Channel renamed to **${newName}**.`, flags: MessageFlags.Ephemeral }).catch(() => null);
            });
            return true;
        }
        if (isModal && action === 'limit') {
            const val = parseInt(interaction.fields.getTextInputValue('vc_limit_input'), 10);
            const limit = isNaN(val) || val < 0 ? 0 : Math.min(val, 99);
            await channel.setUserLimit(limit, `VC Rooms - limit changed by ${member.user.tag}`).catch(() => null);
            updateTempChannel(channelId, { user_limit: limit });
            const newRow = getTempChannel(channelId);
            await interaction.update({ embeds: [buildPanelEmbed(channel, newRow, interaction.guild)], components: buildPanelButtons(channelId) }).catch(async () => {
                await interaction.reply({ content: `✅ User limit set to **${limit === 0 ? 'Unlimited' : limit}**.`, flags: MessageFlags.Ephemeral }).catch(() => null);
            });
            return true;
        }

        // ── User Select Submits ──
        if (isSelect) {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const targetId = interaction.values[0];
            const targetMember = interaction.guild.members.cache.get(targetId) ?? await interaction.guild.members.fetch(targetId).catch(() => null);
            
            if (!targetMember) {
                await interaction.editReply({ content: '❌ User not found.' });
                return true;
            }

            if (action === 'transfer') {
                if (targetId === tempRow.owner_id) {
                    await interaction.editReply({ content: '❌ They are already the owner.' });
                    return true;
                }
                if (targetMember.voice.channelId !== channelId) {
                    await interaction.editReply({ content: '❌ The target user must be inside the voice channel.' });
                    return true;
                }
                updateTempChannel(channelId, { owner_id: targetId });
                const newRow = getTempChannel(channelId);
                await syncChannelPermissions(channel, interaction.guild, newRow);
                await interaction.editReply({ content: `✅ Ownership transferred to <@${targetId}>.` });
                
                // Try to update the original panel message if we can find it
                if (interaction.message && interaction.message.interaction && interaction.message.interaction.customId?.startsWith('vc_')) {
                     // Can't easily update original message from a different interaction, so we just let it be.
                }
                return true;
            }
            if (action === 'permit' || action === 'invite') {
                await permitUser(channel, interaction.guild, targetId, tempRow);
                if (action === 'invite') {
                    // Try to DM
                    const invite = await channel.createInvite({ maxAge: 86400, maxUses: 1, reason: `VC Rooms invite from ${member.user.tag}` }).catch(() => null);
                    if (invite) {
                        await targetMember.send(`You've been invited to join a VC Room by **${member.displayName}**!\n${invite.url}`).catch(() => null);
                    }
                    await interaction.editReply({ content: `✅ <@${targetId}> permitted and invited.` });
                } else {
                    await interaction.editReply({ content: `✅ <@${targetId}> permitted.` });
                }
                return true;
            }
            if (action === 'reject') {
                await rejectUser(channel, interaction.guild, targetMember, tempRow);
                await interaction.editReply({ content: `✅ <@${targetId}> rejected.` });
                return true;
            }
            return true;
        }

        // ── Instant Buttons ──
        let newRow = { ...tempRow };
        if (action === 'lock') {
            updateTempChannel(channelId, { locked: 1 });
            newRow.locked = 1;
        } else if (action === 'unlock') {
            updateTempChannel(channelId, { locked: 0 });
            newRow.locked = 0;
        } else if (action === 'hide') {
            updateTempChannel(channelId, { hidden: 1 });
            newRow.hidden = 1;
        } else if (action === 'show') {
            updateTempChannel(channelId, { hidden: 0 });
            newRow.hidden = 0;
        } else if (action === 'delete') {
            await destroyTempVc(channel, `VC Rooms - deleted by ${member.user.tag}`);
            await interaction.reply({ content: '✅ Channel deleted.', flags: MessageFlags.Ephemeral });
            return true;
        }

        // Sync permissions and update panel
        await syncChannelPermissions(channel, interaction.guild, newRow);
        const embed = buildPanelEmbed(channel, newRow, interaction.guild);
        await interaction.update({ embeds: [embed] }).catch(() => null);
        
        return true;
    } catch (err) {
        logger.error('[handleVcInteraction] Error handling interaction', err);
        if (!interaction.replied && !interaction.deferred) {
             await interaction.reply({ content: '❌ An error occurred.', flags: MessageFlags.Ephemeral }).catch(() => null);
        } else {
             await interaction.followUp({ content: '❌ An error occurred.', flags: MessageFlags.Ephemeral }).catch(() => null);
        }
        return true;
    }
};
