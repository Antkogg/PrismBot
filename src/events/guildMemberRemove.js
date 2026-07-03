import { Events, AttachmentBuilder } from 'discord.js';
import { getWelcomeLogo } from '../repositories/welcomeRepository.js';
import { buildLeaveEmbed } from '../components/embeds/welcomeEmbed.js';
import logger from '../utils/logger.js';

const WELCOME_CHANNEL_ID = '1520243844288086076';

export default {
    name: Events.GuildMemberRemove,
    async execute(member) {
        if (member.user.bot) return;

        try {
            const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID) 
                || await member.guild.channels.fetch(WELCOME_CHANNEL_ID).catch(() => null);
            
            if (!channel) {
                logger.warn(`[guildMemberRemove] Could not find welcome/leave channel ${WELCOME_CHANNEL_ID}`);
                return;
            }

            const attachment = new AttachmentBuilder('./banner.jpg');
            const embed = buildLeaveEmbed(member, 'attachment://banner.jpg');

            await channel.send({ embeds: [embed], files: [attachment] });
            logger.info(`[guildMemberRemove] Sent leave message for ${member.user.tag}`);
        } catch (error) {
            logger.error(`[guildMemberRemove] Failed to send leave message for ${member.user.tag}`, error);
        }
    }
};
