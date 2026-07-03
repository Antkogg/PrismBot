import { REST, Routes } from 'discord.js';
import { env } from '../config/env.js';
import logger from '../utils/logger.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = [];
const foldersPath = path.join(__dirname, '..', 'commands');

const commandFolders = fs.readdirSync(foldersPath);

// Use an async IIFE to process async imports
(async () => {
    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const fileUrl = `file://${filePath.replace(/\\/g, '/')}`;
            
            const commandModule = await import(fileUrl);
            const command = commandModule.default;
            if ('data' in command && 'execute' in command) {
                commands.push(command.data.toJSON());
            }
        }
    }

    const rest = new REST().setToken(env.BOT_TOKEN);

    try {
        logger.info(`Started refreshing ${commands.length} application (/) commands.`);

        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(
            Routes.applicationGuildCommands(env.CLIENT_ID, env.GUILD_ID),
            { body: commands },
        );

        logger.info(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        logger.error('Failed to register slash commands:', error);
    }
})();
