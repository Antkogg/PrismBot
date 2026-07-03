import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { env } from './config/env.js';
import { loadCommands } from './handlers/commandHandler.js';
import { loadEvents } from './handlers/eventHandler.js';
import { setupErrorHandlers } from './handlers/errorHandler.js';
import { initSocialMediaPolling } from './services/socialMediaService.js';
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
        initSocialMediaPolling(client);
        
    } catch (error) {
        logger.error('Failed to log in to Discord. Check your BOT_TOKEN.', error);
    }
};

init();
