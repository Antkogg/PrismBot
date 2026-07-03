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
            // Add a small delay so if the host is doing a zero-downtime deployment,
            // the old bot has time to send its "powering down" message first.
            await new Promise(resolve => setTimeout(resolve, 5000));
            let downtimeStr = '';
            try {
                const fs = await import('node:fs');
                const path = await import('node:path');
                const downtimeFile = path.join(process.cwd(), 'data', 'downtime.json');
                
                if (fs.existsSync(downtimeFile)) {
                    const data = JSON.parse(fs.readFileSync(downtimeFile, 'utf8'));
                    if (data.shutdown) {
                        const downtimeMs = Date.now() - data.shutdown;
                        const downtimeSeconds = (downtimeMs / 1000).toFixed(1);
                        downtimeStr = ` *(Offline for ${downtimeSeconds}s)*`;
                        fs.unlinkSync(downtimeFile); // Clean up so it doesn't leak to next restart
                    }
                }
            } catch (e) {
                logger.error('Failed to read downtime file', e);
            }
            
            const statusChannelId = '1522494120411660299';
            const channel = await client.channels.fetch(statusChannelId).catch(() => null);
            if (channel && channel.isTextBased()) {
                await channel.send(`🟢 **Prism Bot is now online.**${downtimeStr}`);
            }
        } catch (err) {
            logger.error('Failed to send startup message to mod logs.', err);
        }
    }
};
