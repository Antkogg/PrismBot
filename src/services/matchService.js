// Simple in-memory match/scrim storage
const matches = new Map();

/**
 * Schedule a new match or scrim
 * @param {string} id Unique match ID
 * @param {Object} matchData 
 */
export const scheduleMatch = (id, matchData) => {
    matches.set(id, { ...matchData, id });
    return matches.get(id);
};

/**
 * Get all upcoming matches
 */
export const getUpcomingMatches = () => {
    return Array.from(matches.values()).filter(m => m.status === 'upcoming');
};

/**
 * Update match status
 */
export const updateMatchStatus = (id, status) => {
    if (matches.has(id)) {
        const match = matches.get(id);
        match.status = status;
        return match;
    }
    return null;
};
