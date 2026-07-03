import { PermissionsBitField } from 'discord.js';

/**
 * Utility functions for checking permissions
 */
export const hasAdmin = (member) => {
    return member.permissions.has(PermissionsBitField.Flags.Administrator);
};

export const hasManageChannels = (member) => {
    return member.permissions.has(PermissionsBitField.Flags.ManageChannels) || hasAdmin(member);
};
