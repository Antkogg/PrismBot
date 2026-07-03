import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';

// ══════════════════════════════════════════════════════════════════════════════
// Rename Modal
// ══════════════════════════════════════════════════════════════════════════════

export const buildRenameModal = (channelId, currentName = '') =>
    new ModalBuilder()
        .setCustomId(`vc_rename_modal_${channelId}`)
        .setTitle('Rename Your VC Room')
        .addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('vc_rename_input')
                    .setLabel('New channel name')
                    .setStyle(TextInputStyle.Short)
                    .setValue(currentName.slice(0, 100))
                    .setMinLength(1)
                    .setMaxLength(100)
                    .setRequired(true),
            ),
        );

// ══════════════════════════════════════════════════════════════════════════════
// Limit Modal
// ══════════════════════════════════════════════════════════════════════════════

export const buildLimitModal = (channelId, currentLimit = 0) =>
    new ModalBuilder()
        .setCustomId(`vc_limit_modal_${channelId}`)
        .setTitle('Set User Limit')
        .addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('vc_limit_input')
                    .setLabel('Limit (0 = unlimited, max 99)')
                    .setStyle(TextInputStyle.Short)
                    .setValue(String(currentLimit))
                    .setMinLength(1)
                    .setMaxLength(2)
                    .setRequired(true),
            ),
        );
