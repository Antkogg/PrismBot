import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
    EmbedBuilder,
} from 'discord.js';
import logger from '../../utils/logger.js';

// ─────────────────────────────────────────────────────────────────────────────
// Game list for the Opalescent Games category.
//   name  → displayed in Discord (role name, voice channel name, embed)
//   slug  → used for the text channel name (Discord lowercases & hyphenates)
//   color → brand-accurate hex color for the Discord role
// ─────────────────────────────────────────────────────────────────────────────
const GAMES = [
    { name: 'League of Legends',  slug: 'league-of-legends',  color: 0xC89B3C }, // LoL gold
    { name: 'Call of Duty',       slug: 'call-of-duty',        color: 0x4D7C3F }, // military green
    { name: 'Rainbow Six Siege',  slug: 'rainbow-six-siege',   color: 0x006DFF }, // R6 blue
    { name: 'Marvel Rivals',      slug: 'marvel-rivals',       color: 0xE8192C }, // Marvel red
    { name: 'CS2',                slug: 'cs2',                 color: 0xFF6B00 }, // CS orange
    { name: 'Fortnite',           slug: 'fortnite',            color: 0x00C3FF }, // Fortnite cyan
    { name: 'Roblox',             slug: 'roblox',              color: 0xE2231A }, // Roblox red
    { name: 'Minecraft',          slug: 'minecraft',           color: 0x5B8731 }, // grass green
    { name: 'Overwatch',          slug: 'overwatch',           color: 0xFA9C1E }, // OW orange
    { name: 'Rocket League',      slug: 'rocket-league',       color: 0x1A78C2 }, // RL blue
    { name: 'Dead by Daylight',   slug: 'dead-by-daylight',    color: 0x8B0000 }, // blood red
    { name: 'Meccha Chameleon',   slug: 'meccha-chameleon',    color: 0x57E964 }, // chameleon green
    { name: 'Apex Legends',       slug: 'apex-legends',        color: 0xDA292A }, // Apex red
    { name: 'Battlefield',        slug: 'battlefield',         color: 0x4A6FA5 }, // BF steel blue
    { name: 'The Finals',         slug: 'the-finals',          color: 0xE8B84B }, // The Finals gold
    { name: 'Dota 2',             slug: 'dota-2',              color: 0xC23B22 }, // Dota red
];

const CATEGORY_NAME = '◈ OPALESCENT GAMES';

export default {
    data: new SlashCommandBuilder()
        .setName('setup-games')
        .setDescription('Create the Opalescent Games category, roles, text channels, and voice channels')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // Defer — this will take a moment with 16 games
        await interaction.deferReply({ ephemeral: true });

        const guild = interaction.guild;
        const results = [];

        // ── Step 1: Find or create the parent category ────────────────────────
        let category = guild.channels.cache.find(
            c => c.type === ChannelType.GuildCategory && c.name === CATEGORY_NAME
        );

        if (!category) {
            category = await guild.channels.create({
                name: CATEGORY_NAME,
                type: ChannelType.GuildCategory,
                reason: 'Opalescent Games setup',
            });
            logger.info(`[setup-games] Created category: ${CATEGORY_NAME}`);
        } else {
            logger.info(`[setup-games] Category already exists: ${CATEGORY_NAME}`);
        }

        // ── Step 2: Clean up any existing voice channels in the category ─────
        const existingVoiceChannels = guild.channels.cache.filter(
            c => c.type === ChannelType.GuildVoice && c.parentId === category.id
        );
        for (const [, vc] of existingVoiceChannels) {
            await vc.delete('Opalescent Games – removing voice channels');
            logger.info(`[setup-games] Deleted voice channel: ${vc.name}`);
        }

        // ── Step 3: Loop over each game ───────────────────────────────────────
        for (const game of GAMES) {
            try {
                // 2a. Find or create the game role, then always sync color & settings
                let role = guild.roles.cache.find(r => r.name === game.name);
                if (!role) {
                    role = await guild.roles.create({
                        name: game.name,
                        color: game.color,
                        mentionable: true,
                        reason: `Opalescent Games – ${game.name} role`,
                    });
                } else {
                    // Role exists — patch color & mentionable so re-running syncs everything
                    await role.edit({
                        color: game.color,
                        mentionable: true,
                        reason: `Opalescent Games – syncing ${game.name} role`,
                    });
                }

                // 2b. Build permission overwrites:
                //     • @everyone  → deny ViewChannel (private by default)
                //     • game role  → allow ViewChannel, Send
                const permissionOverwrites = [
                    {
                        id: guild.roles.everyone,
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: role.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                        ],
                    },
                ];

                // 2c. Find or create text channel
                let textChannel = guild.channels.cache.find(
                    c =>
                        c.type === ChannelType.GuildText &&
                        c.name === game.slug &&
                        c.parentId === category.id
                );
                if (!textChannel) {
                    textChannel = await guild.channels.create({
                        name: game.slug,
                        type: ChannelType.GuildText,
                        parent: category.id,
                        permissionOverwrites,
                        topic: `💬 Chat for ${game.name} players`,
                        reason: `Opalescent Games – ${game.name} text channel`,
                    });
                }


                results.push({ game: game.name, status: '✅' });
                logger.info(`[setup-games] Set up: ${game.name}`);
            } catch (err) {
                logger.error(`[setup-games] Failed to set up ${game.name}`, err);
                results.push({ game: game.name, status: '❌' });
            }
        }

        // ── Step 3: Reply with a summary embed ────────────────────────────────
        const succeeded = results.filter(r => r.status === '✅').length;
        const failed    = results.filter(r => r.status === '❌').length;

        const embed = new EmbedBuilder()
            .setTitle('🎮 Opalescent Games Setup')
            .setColor('#7B2FBE')
            .setDescription(
                results.map(r => `${r.status} **${r.game}**`).join('\n')
            )
            .addFields(
                {
                    name: 'Summary',
                    value: `${succeeded} game(s) set up successfully${failed ? `, ${failed} failed (check logs)` : ''}.`,
                },
                {
                    name: 'How it works',
                    value:
                        'Each game has:\n' +
                        '• A **role** — assign this to members to grant access\n' +
                        '• A **text channel** — only visible to role holders\n' +
                        '• A **voice channel** — only joinable by role holders',
                }
            )
            .setTimestamp()
            .setFooter({ text: 'Opalescent Prism Bot • Admin only' });

        await interaction.editReply({ embeds: [embed] });
    },
};
