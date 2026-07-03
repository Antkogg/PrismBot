import { Events } from 'discord.js';
import {
    getGuildSettings,
    getTempChannel,
    createTempVc,
    destroyTempVc,
    updateTempChannel
} from '../services/vcService.js';
import logger from '../utils/logger.js';

export default {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        const guild = newState.guild;
        const member = newState.member;
        if (member.user.bot) return; // ignore bots

        const oldChannelId = oldState.channelId;
        const newChannelId = newState.channelId;

        if (oldChannelId === newChannelId) return; // Mute/deafen, no channel change

        const settings = getGuildSettings(guild.id);
        if (!settings) return;

        // ── Joined a channel ──
        if (newChannelId) {
            // Did they join the "Join to Create" channel?
            if (newChannelId === settings.join_channel_id) {
                await createTempVc(guild, member, settings);
            } else {
                // Did they join an existing Temp VC?
                const tempRow = getTempChannel(newChannelId);
                if (tempRow) {
                    updateTempChannel(newChannelId, { last_active_at: new Date().toISOString() });
                }
            }
        }

        // ── Left a channel ──
        if (oldChannelId) {
            const tempRow = getTempChannel(oldChannelId);
            if (tempRow) {
                const oldChannel = guild.channels.cache.get(oldChannelId);
                if (oldChannel && oldChannel.members.size === 0) {
                    await destroyTempVc(oldChannel, 'VC Rooms - auto-delete (empty)');
                }
            }
        }
    },
};
