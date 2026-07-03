import logger from '../utils/logger.js';
import { EmbedBuilder } from 'discord.js';
import { env } from '../config/env.js';

// In-memory store for tracked accounts
const trackedAccounts = new Map([
    ['Twitter', new Set()],
    ['YouTube', new Set()],
    ['Twitch', new Set()]
]);

// Keep track of the last seen post/video ID to avoid duplicates
const lastSeenCache = {
    Twitter: new Map(),
    YouTube: new Map(),
    Twitch: new Map()
};

export const trackAccount = (platform, username) => {
    if (!trackedAccounts.has(platform)) return false;
    trackedAccounts.get(platform).add(username.toLowerCase());
    logger.info(`Started tracking ${platform} account: ${username}`);
    return true;
};

export const untrackAccount = (platform, username) => {
    if (!trackedAccounts.has(platform)) return false;
    const result = trackedAccounts.get(platform).delete(username.toLowerCase());
    if (result) logger.info(`Stopped tracking ${platform} account: ${username}`);
    return result;
};

export const getTrackedAccounts = () => {
    const result = {};
    for (const [platform, accounts] of trackedAccounts.entries()) {
        result[platform] = Array.from(accounts);
    }
    return result;
};

const broadcastToDiscord = async (client, embed) => {
    const channelId = '1520243861006319726';
    try {
        const channel = await client.channels.fetch(channelId);
        if (channel) {
            await channel.send({ content: '@here', embeds: [embed] });
        }
    } catch (err) {
        logger.error('Failed to fetch announcements channel', err);
    }
};

const pollTwitch = async (client) => {
    const accounts = Array.from(trackedAccounts.get('Twitch'));
    if (accounts.length === 0 || !env.TWITCH_CLIENT_ID || !env.TWITCH_CLIENT_SECRET) return;

    try {
        // Simple mock of standard Twitch API flow (Get App Access Token -> Get Streams)
        // Note: For a real production bot, token generation should be cached.
        const tokenRes = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${env.TWITCH_CLIENT_ID}&client_secret=${env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`, { method: 'POST' });
        if (!tokenRes.ok) return logger.error('Twitch auth failed');
        const { access_token } = await tokenRes.json();

        const query = accounts.map(a => `user_login=${a}`).join('&');
        const res = await fetch(`https://api.twitch.tv/helix/streams?${query}`, {
            headers: { 'Client-ID': env.TWITCH_CLIENT_ID, 'Authorization': `Bearer ${access_token}` }
        });
        
        if (!res.ok) return;
        const data = await res.json();
        
        for (const stream of data.data) {
            const username = stream.user_login.toLowerCase();
            if (!lastSeenCache.Twitch.has(username) || lastSeenCache.Twitch.get(username) !== stream.id) {
                lastSeenCache.Twitch.set(username, stream.id);
                
                const embed = new EmbedBuilder()
                    .setTitle(`🟣 ${stream.user_name} is LIVE on Twitch!`)
                    .setURL(`https://twitch.tv/${username}`)
                    .setColor('#6441a5')
                    .setDescription(`**Playing:** ${stream.game_name}\n\n${stream.title}`)
                    .setImage(stream.thumbnail_url.replace('{width}', '1280').replace('{height}', '720'))
                    .setTimestamp();
                    
                await broadcastToDiscord(client, embed);
            }
        }
    } catch (err) {
        logger.error('Error polling Twitch:', err);
    }
};

const pollYouTube = async (client) => {
    const accounts = Array.from(trackedAccounts.get('YouTube'));
    if (accounts.length === 0 || !env.YOUTUBE_API_KEY) return;

    // A real implementation would convert usernames to Channel IDs first.
    // For brevity, assuming the tracked account string is a channel ID here.
    try {
        for (const channelId of accounts) {
            const res = await fetch(`https://www.googleapis.com/youtube/v3/search?key=${env.YOUTUBE_API_KEY}&channelId=${channelId}&part=snippet,id&order=date&maxResults=1`);
            if (!res.ok) continue;
            
            const data = await res.json();
            if (data.items && data.items.length > 0) {
                const video = data.items[0];
                if (video.id.kind === 'youtube#video') {
                    const videoId = video.id.videoId;
                    if (!lastSeenCache.YouTube.has(channelId) || lastSeenCache.YouTube.get(channelId) !== videoId) {
                        lastSeenCache.YouTube.set(channelId, videoId);
                        
                        const embed = new EmbedBuilder()
                            .setTitle(`🔴 New YouTube Video from ${video.snippet.channelTitle}!`)
                            .setURL(`https://youtube.com/watch?v=${videoId}`)
                            .setColor('#FF0000')
                            .setDescription(video.snippet.title)
                            .setImage(video.snippet.thumbnails.high.url)
                            .setTimestamp();
                            
                        await broadcastToDiscord(client, embed);
                    }
                }
            }
        }
    } catch (err) {
        logger.error('Error polling YouTube:', err);
    }
};

const pollTwitter = async (client) => {
    const accounts = Array.from(trackedAccounts.get('Twitter'));
    if (accounts.length === 0 || !env.TWITTER_BEARER_TOKEN) return;

    try {
        for (const username of accounts) {
            // Note: Twitter v2 API requires fetching User ID first, then tweets.
            // Mocking the flow for brevity
            const userRes = await fetch(`https://api.twitter.com/2/users/by/username/${username}`, {
                headers: { 'Authorization': `Bearer ${env.TWITTER_BEARER_TOKEN}` }
            });
            if (!userRes.ok) continue;
            
            const userData = await userRes.json();
            if (!userData.data) continue;
            
            const userId = userData.data.id;
            const tweetRes = await fetch(`https://api.twitter.com/2/users/${userId}/tweets?max_results=5`, {
                headers: { 'Authorization': `Bearer ${env.TWITTER_BEARER_TOKEN}` }
            });
            if (!tweetRes.ok) continue;
            
            const tweetData = await tweetRes.json();
            if (tweetData.data && tweetData.data.length > 0) {
                const latestTweet = tweetData.data[0];
                
                if (!lastSeenCache.Twitter.has(username) || lastSeenCache.Twitter.get(username) !== latestTweet.id) {
                    lastSeenCache.Twitter.set(username, latestTweet.id);
                    
                    const embed = new EmbedBuilder()
                        .setTitle(`🐦 New Tweet from @${username}!`)
                        .setURL(`https://twitter.com/${username}/status/${latestTweet.id}`)
                        .setColor('#1DA1F2')
                        .setDescription(latestTweet.text)
                        .setTimestamp();
                        
                    await broadcastToDiscord(client, embed);
                }
            }
        }
    } catch (err) {
        logger.error('Error polling Twitter:', err);
    }
};

export const initSocialMediaPolling = (client) => {
    logger.info('Initializing native social media polling...');
    
    // Poll Twitch & YouTube every 5 minutes
    setInterval(() => {
        pollTwitch(client);
        pollYouTube(client);
    }, 5 * 60 * 1000);
    
    // Poll Twitter every 15 minutes to respect rate limits
    setInterval(() => {
        pollTwitter(client);
    }, 15 * 60 * 1000);
};
