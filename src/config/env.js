import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const env = {
    BOT_TOKEN: process.env.BOT_TOKEN,
    CLIENT_ID: process.env.CLIENT_ID,
    GUILD_ID: process.env.GUILD_ID,
    TWITCH_CLIENT_ID: process.env.TWITCH_CLIENT_ID,
    TWITCH_CLIENT_SECRET: process.env.TWITCH_CLIENT_SECRET,
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
    TWITTER_BEARER_TOKEN: process.env.TWITTER_BEARER_TOKEN
};

// Validate that required env variables are present
if (!env.BOT_TOKEN || !env.CLIENT_ID || !env.GUILD_ID) {
    console.error('Missing required environment variables. Please check your .env file.');
    process.exit(1);
}
