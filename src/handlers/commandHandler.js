import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Loads all commands from the commands directory into the client's command collection
 * @param {import('discord.js').Client} client 
 */
export const loadCommands = async (client) => {
    const foldersPath = path.join(__dirname, '..', 'commands');
    
    // Check if the commands folder exists
    if (!fs.existsSync(foldersPath)) {
        logger.warn('Commands directory not found.');
        return;
    }

    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            // Convert to file:// URL for dynamic import in ES modules on Windows
            const fileUrl = `file://${filePath.replace(/\\/g, '/')}`;
            
            try {
                const commandModule = await import(fileUrl);
                const command = commandModule.default;

                if ('data' in command && 'execute' in command) {
                    client.commands.set(command.data.name, command);
                    logger.info(`Loaded command: ${command.data.name}`);
                } else {
                    logger.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
                }
            } catch (error) {
                logger.error(`Error loading command at ${filePath}`, error);
            }
        }
    }
};
