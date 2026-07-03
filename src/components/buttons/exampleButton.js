import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

/**
 * Example button component
 */
export const createExampleButton = () => {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('example_button')
            .setLabel('Click Me')
            .setStyle(ButtonStyle.Primary)
    );
};
