/**
 * Tracks temporary voice channel IDs and their inactivity timers.
 * When a temp VC becomes empty a 15-minute countdown starts.
 * If someone rejoins before it fires the timer is cancelled.
 */

const INACTIVITY_MS = 15 * 60 * 1000; // 15 minutes

/** Map<channelId, timeoutHandle> — undefined timeout = channel has members */
const tempVoiceChannels = new Map();

/** Register a new temp VC (no timer yet — channel was just created) */
export const registerTempVc = (channelId) => tempVoiceChannels.set(channelId, null);

/** Returns true if this channel is a tracked temp VC */
export const isTempVc = (channelId) => tempVoiceChannels.has(channelId);

/**
 * Start the 15-minute inactivity timer for an empty temp VC.
 * @param {string} channelId
 * @param {() => void} onExpire  Callback that deletes the channel
 */
export const startInactivityTimer = (channelId, onExpire) => {
    // Clear any existing timer first (shouldn't happen, but be safe)
    cancelInactivityTimer(channelId);
    const handle = setTimeout(onExpire, INACTIVITY_MS);
    tempVoiceChannels.set(channelId, handle);
};

/**
 * Cancel the inactivity timer (e.g. someone rejoined).
 */
export const cancelInactivityTimer = (channelId) => {
    const handle = tempVoiceChannels.get(channelId);
    if (handle) {
        clearTimeout(handle);
        tempVoiceChannels.set(channelId, null);
    }
};

/** Remove the channel from tracking entirely */
export const removeTempVc = (channelId) => {
    cancelInactivityTimer(channelId);
    tempVoiceChannels.delete(channelId);
};
