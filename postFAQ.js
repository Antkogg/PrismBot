import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const FAQ_CHANNEL_ID = '1520243848226275428';

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}! Posting FAQ...`);

    try {
        const channel = await client.channels.fetch(FAQ_CHANNEL_ID);

        const embed = new EmbedBuilder()
            .setTitle('🌟 Opalescent Esports — Frequently Asked Questions')
            .setColor('#7B2FBE')
            .setDescription('Welcome to the official Opalescent Esports server! Here is a quick guide to everything you can do here.')
            .addFields(
                {
                    name: '🎮 Looking For Group (LFG)',
                    value: 'Need a squad? Use the `/lfg post` command to find players for your game! You can browse active groups using `/lfg browse`.'
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

        await channel.send({ embeds: [embed] });
        
        console.log('✅ Successfully posted the new FAQ embed!');
    } catch (error) {
        console.error('❌ Failed to post FAQ:', error);
    }

    process.exit(0);
});

client.login(process.env.BOT_TOKEN);
