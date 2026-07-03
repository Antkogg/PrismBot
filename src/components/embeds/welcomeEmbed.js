import { EmbedBuilder, time, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

/**
 * Builds the Welcome embed
 * @param {import('discord.js').GuildMember} member 
 * @param {string|null} logoUrl 
 * @returns {EmbedBuilder}
 */
export const buildWelcomeEmbed = (member, logoUrl) => {
    const avatarUrl = member.user.displayAvatarURL({ forceStatic: false, extension: 'png', size: 512 });
    const guildIconUrl = member.guild.iconURL({ forceStatic: false, extension: 'png', size: 512 });

    const embed = new EmbedBuilder()
        .setColor('#9B5CFF')
        .setAuthor({ 
            name: 'Opalescent Community', 
            iconURL: guildIconUrl || undefined 
        })
        .setTitle(`💎 Welcome in, ${member.displayName}`)
        .setDescription(`Welcome to **Opalescent Community**, <@${member.id}>.\n\nYou’re all set and officially part of the community.`)
        .setThumbnail(avatarUrl)
        .addFields(
            {
                name: "✨ You’re Ready",
                value: "Your game and ping roles should already be applied.\nYou can update them anytime from **Channels & Roles**.",
                inline: false
            },
            {
                name: "🚀 Jump In",
                value: "• Check your game channels\n• Watch announcements\n• Join events and giveaways\n• Hop into voice and hang out",
                inline: false
            },
            {
                name: "🎙️ Voice Rooms",
                value: "Need your own temporary VC? Join **Join to Create** and the bot will make one for you.",
                inline: false
            },
            {
                name: "👥 Member",
                value: `#${member.guild.memberCount}`,
                inline: true
            },
            {
                name: "🕒 Created",
                value: time(member.user.createdAt, 'R'),
                inline: true
            }
        )
        .setFooter({ 
            text: 'Welcome to Opalescent Community', 
            iconURL: avatarUrl 
        });

    if (logoUrl) {
        embed.setImage(logoUrl);
    }

    return embed;
};

/**
 * Builds the components for the Welcome embed
 * @returns {import('discord.js').ActionRowBuilder}
 */
export const buildWelcomeComponents = () => {
    const voiceRoomsButton = new ButtonBuilder()
        .setLabel('Voice Rooms')
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.com/channels/1520229696703565916/1522468337743822848');

    return new ActionRowBuilder().addComponents(voiceRoomsButton);
};

/**
 * Builds the Leave embed
 * @param {import('discord.js').GuildMember} member 
 * @param {string|null} logoUrl 
 * @returns {EmbedBuilder}
 */
export const buildLeaveEmbed = (member, logoUrl) => {
    const avatarUrl = member.user.displayAvatarURL({ forceStatic: false, extension: 'png', size: 512 });
    const guildIconUrl = member.guild.iconURL({ forceStatic: false, extension: 'png', size: 512 });
    
    const joinedAtValue = member.joinedAt ? time(member.joinedAt, 'R') : 'Unknown';

    const embed = new EmbedBuilder()
        .setColor('#9B5CFF')
        .setAuthor({ 
            name: 'Opalescent Community', 
            iconURL: guildIconUrl || undefined 
        })
        .setTitle(`💎 ${member.displayName} left Opalescent Community`)
        .setDescription('Thanks for being part of the community.\nWe hope to see you around again sometime.')
        .setThumbnail(avatarUrl)
        .addFields(
            {
                name: "👥 Members",
                value: `${member.guild.memberCount} remaining`,
                inline: true
            },
            {
                name: "🕒 Created",
                value: time(member.user.createdAt, 'R'),
                inline: true
            },
            {
                name: "📅 Joined",
                value: joinedAtValue,
                inline: true
            }
        )
        .setFooter({ 
            text: 'Opalescent Community', 
            iconURL: guildIconUrl || undefined 
        });

    if (logoUrl) {
        embed.setImage(logoUrl);
    }

    return embed;
};
