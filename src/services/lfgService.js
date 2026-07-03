// Simple in-memory LFG storage
const lfgListings = new Map();

/**
 * Create an LFG post
 */
export const createLFG = (userId, game, rank, description) => {
    lfgListings.set(userId, { game, rank, description, timestamp: Date.now() });
    return true;
};

/**
 * Remove an LFG post
 */
export const removeLFG = (userId) => {
    if (lfgListings.has(userId)) {
        lfgListings.delete(userId);
        return true;
    }
    return false;
};

/**
 * Get all LFG posts
 */
export const getAllLFG = (game = null) => {
    let listings = Array.from(lfgListings.entries()).map(([userId, data]) => ({ userId, ...data }));
    if (game) {
        listings = listings.filter(l => l.game.toLowerCase() === game.toLowerCase());
    }
    return listings;
};
