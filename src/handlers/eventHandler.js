import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Loads all events from the events directory and registers them with the client
 * @param {import('discord.js').Client} client 
 */
export const loadEvents = async (client) => {
    const eventsPath = path.join(__dirname, '..', 'events');
    
    if (!fs.existsSync(eventsPath)) {
        logger.warn('Events directory not found.');
        return;
    }

    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        // Convert to file:// URL for dynamic import in ES modules on Windows
        const fileUrl = `file://${filePath.replace(/\\/g, '/')}`;

        try {
            const eventModule = await import(fileUrl);
            const event = eventModule.default;

            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args));
            } else {
                client.on(event.name, (...args) => event.execute(...args));
            }
            logger.info(`Loaded event: ${event.name}`);
        } catch (error) {
            logger.error(`Error loading event at ${filePath}`, error);
        }
    }
};
