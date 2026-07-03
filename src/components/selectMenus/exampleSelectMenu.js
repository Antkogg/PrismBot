import { ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';

/**
 * Example select menu component
 */
export const createExampleSelectMenu = () => {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('example_select_menu')
            .setPlaceholder('Make a selection')
            .addOptions([
                {
                    label: 'Option 1',
                    description: 'This is the first option',
                    value: 'option_1',
                },
                {
                    label: 'Option 2',
                    description: 'This is the second option',
                    value: 'option_2',
                },
            ])
    );
};
