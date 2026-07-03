import { Events } from 'discord.js';
import logger from '../utils/logger.js';
import botConfig from '../config/botConfig.js';
import { startupCleanup } from '../services/vcService.js';

export default {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        logger.info(`Ready! Logged in as ${client.user.tag}`);
        client.user.setActivity(`${botConfig.organization}`);

        // Clean up any orphaned temp VCs on startup
        await startupCleanup(client);
    }
};
