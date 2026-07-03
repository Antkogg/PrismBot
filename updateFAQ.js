import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

// ─────────────────────────────────────────────────────────────────────────
// 📝 FILL IN THESE IDS BEFORE RUNNING
// ─────────────────────────────────────────────────────────────────────────
const FAQ_CHANNEL_ID = 'REPLACE_ME_WITH_CHANNEL_ID';
const FAQ_MESSAGE_ID = 'REPLACE_ME_WITH_MESSAGE_ID';

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}! Updating FAQ message...`);

    try {
        const channel = await client.channels.fetch(FAQ_CHANNEL_ID);
        const message = await channel.messages.fetch(FAQ_MESSAGE_ID);

        // Get the existing embed from the message
        const existingEmbed = message.embeds[0];
        if (!existingEmbed) {
            console.error('❌ No embed found on the target message!');
            process.exit(1);
        }

        // Create a new embed based on the existing one
        const updatedEmbed = EmbedBuilder.from(existingEmbed);

        // Append the new VC Rooms information field
        updatedEmbed.addFields({
            name: '🎙️ Temporary VC Rooms',
            value: 'To create your own private or public voice channel, simply join the **➕ Join to Create** channel!\n\nOnce inside, you become the room owner. You can use the `/vc panel` command or `/vc help` to manage your room (lock it, rename it, set user limits, and permit/reject users). Your room will automatically be deleted when everyone leaves.'
        });

        // Edit the message
        await message.edit({ embeds: [updatedEmbed] });
        
        console.log('✅ Successfully updated the FAQ embed!');
    } catch (error) {
        console.error('❌ Failed to update FAQ:', error);
    }

    process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
