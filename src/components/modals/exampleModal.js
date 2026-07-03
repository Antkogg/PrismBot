import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';

/**
 * Example modal component
 */
export const createExampleModal = () => {
    const modal = new ModalBuilder()
        .setCustomId('example_modal')
        .setTitle('Example Modal');

    const input = new TextInputBuilder()
        .setCustomId('example_input')
        .setLabel("What's your favorite color?")
        .setStyle(TextInputStyle.Short);

    const actionRow = new ActionRowBuilder().addComponents(input);
    modal.addComponents(actionRow);

    return modal;
};
