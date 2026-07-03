import { Events } from 'discord.js';
import { getWelcomeLogo } from '../repositories/welcomeRepository.js';
import { buildWelcomeEmbed, buildWelcomeComponents } from '../components/embeds/welcomeEmbed.js';
import logger from '../utils/logger.js';

const WELCOME_CHANNEL_ID = '1520243844288086076';

export default {
    name: Events.GuildMemberAdd,
    async execute(member) {
        if (member.user.bot) return;

        try {
            const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID) 
                || await member.guild.channels.fetch(WELCOME_CHANNEL_ID).catch(() => null);
            
            if (!channel) {
                logger.warn(`[guildMemberAdd] Could not find welcome channel ${WELCOME_CHANNEL_ID}`);
                return;
            }

            const logoUrl = getWelcomeLogo();
            const embed = buildWelcomeEmbed(member, logoUrl);
            const components = buildWelcomeComponents();

            await channel.send({ content: `<@${member.id}>`, embeds: [embed], components: [components] });
            logger.info(`[guildMemberAdd] Sent welcome message for ${member.user.tag}`);
        } catch (error) {
            logger.error(`[guildMemberAdd] Failed to send welcome message for ${member.user.tag}`, error);
        }
    }
};
