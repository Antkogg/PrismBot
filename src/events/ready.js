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

        try {
            const statusChannelId = '1522494120411660299';
            const channel = await client.channels.fetch(statusChannelId).catch(() => null);
            if (channel && channel.isTextBased()) {
                await channel.send('🟢 **Prism Bot is now online.**');
            }
        } catch (err) {
            logger.error('Failed to send startup message to mod logs.', err);
        }
    }
};
