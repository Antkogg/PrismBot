import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { env } from './config/env.js';
import { loadCommands } from './handlers/commandHandler.js';
import { loadEvents } from './handlers/eventHandler.js';
import { setupErrorHandlers } from './handlers/errorHandler.js';
import { initDatabase } from './database/db.js';
import logger from './utils/logger.js';

// Setup global error handling
setupErrorHandlers();

// Initialize Database
initDatabase();

// Create a new client instance
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates, // required for VoiceStateUpdate (temp VC auto-delete)
        GatewayIntentBits.GuildMembers, // required for guildMemberAdd and guildMemberRemove
    ] 
});

// Initialize a Collection for commands
client.commands = new Collection();

// Main initialization function
const init = async () => {
    // Load commands and events
    await loadCommands(client);
    await loadEvents(client);

    // Log in to Discord with the bot's token
    try {
        await client.login(env.BOT_TOKEN);
        
        // Start background tasks once logged in
    } catch (error) {
        logger.error('Failed to log in to Discord. Check your BOT_TOKEN.', error);
    }
};

init();

// Graceful shutdown handling
const handleShutdown = async (signal) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    try {
        if (client.isReady()) {
            const statusChannelId = '1522494120411660299';
            const channel = await client.channels.fetch(statusChannelId).catch(() => null);
            if (channel && channel.isTextBased()) {
                await channel.send('🔴 **Prism Bot is powering down for an update.**');
            }
        }
    } catch (err) {
        logger.error('Failed to send shutdown message to mod logs.', err);
    } finally {
        try {
            const fs = await import('node:fs');
            const path = await import('node:path');
            fs.writeFileSync(path.join(process.cwd(), 'data', 'downtime.json'), JSON.stringify({ shutdown: Date.now() }));
        } catch (e) {
            logger.error('Failed to write downtime file', e);
        }
        try {
            const { getDb } = await import('./database/db.js');
            const db = getDb();
            if (db) db.close();
        } catch (e) {
            logger.error('Failed to close database', e);
        }
        client.destroy();
        process.exit(0);
    }
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
