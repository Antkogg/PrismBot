import { getDb } from '../database/db.js';

// ══════════════════════════════════════════════════════════════════════════════
// Guild Settings
// ══════════════════════════════════════════════════════════════════════════════

export const getGuildSettings = (guildId) =>
    getDb().prepare('SELECT * FROM vc_guild_settings WHERE guild_id = ?').get(guildId);

export const upsertGuildSettings = (settings) => {
    getDb().prepare(`
        INSERT INTO vc_guild_settings
            (guild_id, category_id, join_channel_id, default_name_template,
             default_user_limit, default_bitrate, default_region, interface_enabled)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(guild_id) DO UPDATE SET
            category_id           = excluded.category_id,
            join_channel_id       = excluded.join_channel_id,
            default_name_template = excluded.default_name_template,
            default_user_limit    = excluded.default_user_limit,
            default_bitrate       = excluded.default_bitrate,
            default_region        = excluded.default_region,
            interface_enabled     = excluded.interface_enabled,
            updated_at            = datetime('now')
    `).run(
        settings.guild_id,
        settings.category_id    ?? null,
        settings.join_channel_id ?? null,
        settings.default_name_template ?? "{display_name}'s VC",
        settings.default_user_limit    ?? 0,
        settings.default_bitrate       ?? 64000,
        settings.default_region        ?? null,
        settings.interface_enabled !== false ? 1 : 0,
    );
};

export const deleteGuildSettings = (guildId) =>
    getDb().prepare('DELETE FROM vc_guild_settings WHERE guild_id = ?').run(guildId);

// ══════════════════════════════════════════════════════════════════════════════
// Temp Channels
// ══════════════════════════════════════════════════════════════════════════════

export const getTempChannel = (channelId) =>
    getDb().prepare('SELECT * FROM vc_temp_channels WHERE channel_id = ?').get(channelId);

export const getTempChannelByOwner = (guildId, ownerId) =>
    getDb().prepare('SELECT * FROM vc_temp_channels WHERE guild_id = ? AND owner_id = ?').get(guildId, ownerId);

export const getAllTempChannelsForGuild = (guildId) =>
    getDb().prepare('SELECT * FROM vc_temp_channels WHERE guild_id = ?').all(guildId);

export const getAllTempChannels = () =>
    getDb().prepare('SELECT * FROM vc_temp_channels').all();

export const createTempChannel = (data) =>
    getDb().prepare(`
        INSERT INTO vc_temp_channels (channel_id, guild_id, owner_id, name, user_limit)
        VALUES (?, ?, ?, ?, ?)
    `).run(data.channel_id, data.guild_id, data.owner_id, data.name, data.user_limit ?? 0);

export const updateTempChannel = (channelId, fields) => {
    const ALLOWED = ['owner_id', 'name', 'locked', 'hidden', 'user_limit', 'last_active_at'];
    const entries = Object.entries(fields).filter(([k]) => ALLOWED.includes(k));
    if (!entries.length) return;
    const sets = entries.map(([k]) => `${k} = ?`).join(', ');
    const vals = entries.map(([, v]) => v);
    getDb().prepare(`UPDATE vc_temp_channels SET ${sets} WHERE channel_id = ?`).run(...vals, channelId);
};

export const deleteTempChannelRecord = (channelId) => {
    getDb().prepare('DELETE FROM vc_temp_channels WHERE channel_id = ?').run(channelId);
    getDb().prepare('DELETE FROM vc_permissions WHERE channel_id = ?').run(channelId);
};

export const deleteAllTempChannelsForGuild = (guildId) => {
    const rows = getAllTempChannelsForGuild(guildId);
    rows.forEach(r => deleteTempChannelRecord(r.channel_id));
};

// ══════════════════════════════════════════════════════════════════════════════
// Permissions
// ══════════════════════════════════════════════════════════════════════════════

export const getChannelPermissions = (channelId) =>
    getDb().prepare('SELECT * FROM vc_permissions WHERE channel_id = ?').all(channelId);

export const getUserPermission = (channelId, userId) =>
    getDb().prepare('SELECT * FROM vc_permissions WHERE channel_id = ? AND user_id = ?').get(channelId, userId);

export const upsertPermission = (guildId, channelId, userId, type) =>
    getDb().prepare(`
        INSERT INTO vc_permissions (guild_id, channel_id, user_id, permission_type)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(channel_id, user_id) DO UPDATE SET permission_type = excluded.permission_type
    `).run(guildId, channelId, userId, type);

export const deletePermission = (channelId, userId) =>
    getDb().prepare('DELETE FROM vc_permissions WHERE channel_id = ? AND user_id = ?').run(channelId, userId);
