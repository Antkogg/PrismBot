import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('setup-faq')
        .setDescription('Posts the official Opalescent Esports FAQ embed to the current channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🌟 Opalescent Esports — Frequently Asked Questions')
            .setColor('#7B2FBE')
            .setDescription('Welcome to the official Opalescent Esports server! Here is a quick guide to everything you can do here.')
            .addFields(
                {
                    name: '🎮 Finding Games & Teammates',
                    value: 'To get access to specific game categories and text channels, head over to Discord\'s **Channels & Roles** menu at the top of the server! Once you select your roles, you\'ll instantly unlock the channels for those games so you can chat and find teammates.'
                },
                {
                    name: '📅 Matches & Rosters',
                    value: 'Check out the official team rosters with `/roster view` and keep an eye on upcoming matches with `/match upcoming`.'
                },
                {
                    name: '🎙️ Temporary VC Rooms',
                    value: 'To create your own private or public voice channel, simply join the **➕ Join to Create** channel!\n\nOnce inside, you become the room owner. You can use the `/vc panel` command or `/vc help` to manage your room (lock it, rename it, set user limits, and permit/reject users). Your room will automatically be deleted when everyone leaves.'
                },
                {
                    name: '❓ Need Help?',
                    value: 'If you have any other questions, feel free to use the `/help` command to see a full list of everything the bot can do, or ping a moderator!'
                }
            )
            .setFooter({ text: 'Opalescent Prism Bot' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
