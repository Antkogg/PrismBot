import { Events, MessageFlags } from 'discord.js';
import logger from '../utils/logger.js';
import constants from '../utils/constants.js';
import { handleVcInteraction } from '../handlers/vcInteractionHandler.js';

export default {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Intercept VC component interactions (buttons, modals, select menus)
        if (await handleVcInteraction(interaction)) return;

        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            logger.warn(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            logger.error(`Error executing ${interaction.commandName}`, error);
            
            const reply = { content: constants.DEFAULT_ERROR_MESSAGE, flags: MessageFlags.Ephemeral };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(reply);
            } else {
                await interaction.reply(reply);
            }
        }
    }
};
