import { PermissionFlagsBits } from 'discord.js';
import logger from '../utils/logger.js';
import {
    getAllTempChannels,
    getTempChannel,
    getTempChannelByOwner,
    createTempChannel,
    updateTempChannel,
    deleteTempChannelRecord,
    getGuildSettings,
    upsertPermission,
    deletePermission,
    getChannelPermissions,
} from '../repositories/vcRepository.js';

// ══════════════════════════════════════════════════════════════════════════════
// Name Template Resolution
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Resolves a name template with member context.
 * Supported variables: {username}, {display_name}, {mention}, {count}, {game}
 */
export const resolveNameTemplate = (template, member, count = 1) => {
    const game = member.presence?.activities?.find(a => a.type === 0)?.name ?? '';
    return template
        .replace(/{username}/g,     member.user.username)
        .replace(/{display_name}/g, member.displayName)
        .replace(/{mention}/g,      `@${member.displayName}`)
        .replace(/{count}/g,        String(count))
        .replace(/{game}/g,         game)
        .slice(0, 100); // Discord max channel name length
};

// ══════════════════════════════════════════════════════════════════════════════
// Permission Helpers
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Returns true if the member is the VC owner, an Administrator,
 * or has the Manage Channels permission.
 */
export const isOwnerOrAdmin = (member, tempRow) => {
    if (!tempRow) return false;
    if (tempRow.owner_id === member.id) return true;
    return member.permissions.has(PermissionFlagsBits.Administrator) ||
           member.permissions.has(PermissionFlagsBits.ManageChannels);
};

// ══════════════════════════════════════════════════════════════════════════════
// Channel Permission Helpers
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Returns the base @everyone permission state for a locked/hidden VC.
 * Always call this after lock/hide/show/unlock to keep overwrites correct.
 */
const everyoneOverwrite = (tempRow) => {
    if (tempRow.hidden) {
        return {
            id: 'everyone',
            deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
        };
    }
    if (tempRow.locked) {
        return {
            id: 'everyone',
            allow: [PermissionFlagsBits.ViewChannel],
            deny:  [PermissionFlagsBits.Connect],
        };
    }
    return {
        id: 'everyone',
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
    };
};

/**
 * Re-syncs all permission overwrites on a channel based on DB state.
 * Call after any state change (lock/unlock/hide/show/permit/reject).
 */
export const syncChannelPermissions = async (channel, guild, tempRow) => {
    const perms  = getChannelPermissions(tempRow.channel_id);
    const everyoneRole = guild.roles.everyone;

    const overwrites = [];

    // Base @everyone
    const baseOverwrite = everyoneOverwrite(tempRow);
    overwrites.push({
        id:    everyoneRole.id,
        allow: baseOverwrite.allow ?? [],
        deny:  baseOverwrite.deny  ?? [],
    });

    // Owner always has full control
    overwrites.push({
        id:    tempRow.owner_id,
        allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.Speak,
            PermissionFlagsBits.Stream,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.MoveMembers,
            PermissionFlagsBits.MuteMembers,
            PermissionFlagsBits.DeafenMembers,
        ],
    });

    // Permitted users get view + connect regardless of lock/hide
    for (const p of perms) {
        if (p.permission_type === 'permit') {
            overwrites.push({
                id:    p.user_id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
            });
        } else if (p.permission_type === 'reject') {
            overwrites.push({
                id:   p.user_id,
                deny: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel],
            });
        }
    }

    await channel.permissionOverwrites.set(overwrites, 'VC Rooms – syncing permissions');
};

// ══════════════════════════════════════════════════════════════════════════════
// Temp VC Lifecycle
// ══════════════════════════════════════════════════════════════════════════════

const creationLocks = new Set();

/**
 * Creates a temporary voice channel for a member who joined the JTC channel.
 * Saves the channel to the database and moves the member into it.
 */
export const createTempVc = async (guild, member, settings) => {
    // Prevent rapid duplicate creation
    if (creationLocks.has(member.id)) return null;
    creationLocks.add(member.id);

    try {
        // If they already own a channel, just move them to it
        const existingRow = getTempChannelByOwner(guild.id, member.id);
        if (existingRow) {
            const existingChannel = guild.channels.cache.get(existingRow.channel_id) 
                                 ?? await guild.channels.fetch(existingRow.channel_id).catch(() => null);
            if (existingChannel) {
                await member.voice.setChannel(existingChannel, 'VC Rooms – moving to existing temp VC').catch(() => null);
                return existingChannel;
            } else {
                deleteTempChannelRecord(existingRow.channel_id); // clean up dead row
            }
        }

        const existingChannels = (await guild.channels.fetch()).filter(
            c => c && c.parentId === settings.category_id &&
                 getTempChannel(c.id) !== undefined
        );
        const count = existingChannels.size + 1;

        const name = resolveNameTemplate(settings.default_name_template, member, count);

    const everyoneRole = guild.roles.everyone;
    const channel = await guild.channels.create({
        name,
        type:   2, // GuildVoice
        parent: settings.category_id,
        userLimit:  settings.default_user_limit ?? 0,
        bitrate:    settings.default_bitrate    ?? 64000,
        rtcRegion:  settings.default_region     ?? null,
        permissionOverwrites: [
            {
                id:    everyoneRole.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
            },
            {
                id:    member.id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.Connect,
                    PermissionFlagsBits.Speak,
                    PermissionFlagsBits.Stream,
                    PermissionFlagsBits.ManageChannels,
                    PermissionFlagsBits.MoveMembers,
                    PermissionFlagsBits.MuteMembers,
                    PermissionFlagsBits.DeafenMembers,
                ],
            },
        ],
        reason: `VC Rooms – created by ${member.user.tag}`,
    });

        createTempChannel({
            channel_id: channel.id,
            guild_id:   guild.id,
            owner_id:   member.id,
            name,
            user_limit: settings.default_user_limit ?? 0,
        });

        // Move the member into their new channel
        await member.voice.setChannel(channel, 'VC Rooms – moving to temp VC').catch(() => null);

        logger.info(`[vcService] Created temp VC "${name}" (${channel.id}) for ${member.user.tag}`);
        return channel;
    } finally {
        creationLocks.delete(member.id);
    }
};

/**
 * Deletes a temporary voice channel from Discord and removes its DB records.
 * Safe to call even if the channel no longer exists in Discord.
 */
export const destroyTempVc = async (channelOrId, reason = 'VC Rooms – auto-delete') => {
    const channelId = typeof channelOrId === 'string' ? channelOrId : channelOrId.id;
    if (typeof channelOrId !== 'string') {
        await channelOrId.delete(reason).catch(() => null);
    }
    deleteTempChannelRecord(channelId);
    logger.info(`[vcService] Destroyed temp VC ${channelId}`);
};

// ══════════════════════════════════════════════════════════════════════════════
// Permit / Reject helpers
// ══════════════════════════════════════════════════════════════════════════════

export const permitUser = async (channel, guild, userId, tempRow) => {
    upsertPermission(guild.id, channel.id, userId, 'permit');
    updateTempChannel(channel.id, {}); // touch for last_active_at optional
    await syncChannelPermissions(channel, guild, { ...tempRow, ...getTempChannel(channel.id) });
};

export const unpermitUser = async (channel, guild, userId, tempRow) => {
    deletePermission(channel.id, userId);
    await syncChannelPermissions(channel, guild, tempRow);
};

export const rejectUser = async (channel, guild, member, tempRow) => {
    upsertPermission(guild.id, channel.id, member.id, 'reject');
    await syncChannelPermissions(channel, guild, tempRow);
    // Disconnect if currently inside
    if (member.voice?.channelId === channel.id) {
        await member.voice.disconnect('VC Rooms – rejected from VC').catch(() => null);
    }
};

// ══════════════════════════════════════════════════════════════════════════════
// Startup Cleanup
// ══════════════════════════════════════════════════════════════════════════════

/**
 * On bot startup: scan all saved temp channels.
 * – Missing from Discord → remove from DB.
 * – Exists but empty → delete from Discord + DB.
 * – Exists with members → keep active.
 */
export const startupCleanup = async (client) => {
    const allRows = getAllTempChannels();
    if (!allRows.length) return;

    logger.info(`[vcService] Startup cleanup: checking ${allRows.length} saved temp channel(s)...`);
    let cleaned = 0;

    for (const row of allRows) {
        try {
            const guild = client.guilds.cache.get(row.guild_id)
                       ?? await client.guilds.fetch(row.guild_id).catch(() => null);
            if (!guild) { deleteTempChannelRecord(row.channel_id); cleaned++; continue; }

            const channel = guild.channels.cache.get(row.channel_id)
                         ?? await guild.channels.fetch(row.channel_id).catch(() => null);

            if (!channel) {
                deleteTempChannelRecord(row.channel_id);
                cleaned++;
                continue;
            }

            if (channel.members.size === 0) {
                await destroyTempVc(channel, 'VC Rooms – startup cleanup (empty)');
                cleaned++;
            }
            // else: has members, leave it alone
        } catch (err) {
            logger.warn(`[vcService] Cleanup error for ${row.channel_id}: ${err.message}`);
            deleteTempChannelRecord(row.channel_id);
            cleaned++;
        }
    }

    logger.info(`[vcService] Startup cleanup complete. Removed ${cleaned} orphaned channel(s).`);
};

// ══════════════════════════════════════════════════════════════════════════════
// Re-export repository helpers needed by interaction handler
// ══════════════════════════════════════════════════════════════════════════════
export {
    getGuildSettings,
    upsertGuildSettings,
    deleteGuildSettings,
    getTempChannel,
    getTempChannelByOwner,
    updateTempChannel,
    deleteAllTempChannelsForGuild,
    getChannelPermissions,
    upsertPermission,
    deletePermission,
} from '../repositories/vcRepository.js';
