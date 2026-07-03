// Simple in-memory roster storage for now
const rosters = new Map();

/**
 * Get the roster for a specific team
 * @param {string} teamName 
 * @returns {Array} Array of player names/IDs
 */
export const getRoster = (teamName) => {
    return rosters.get(teamName.toLowerCase()) || [];
};

/**
 * Add a player to a team's roster
 * @param {string} teamName 
 * @param {string} player 
 * @returns {boolean} True if added, false if already on roster
 */
export const addPlayerToRoster = (teamName, player) => {
    const team = teamName.toLowerCase();
    const currentRoster = getRoster(team);
    
    if (currentRoster.includes(player)) {
        return false; // Already on roster
    }
    
    rosters.set(team, [...currentRoster, player]);
    return true;
};

/**
 * Remove a player from a team's roster
 * @param {string} teamName 
 * @param {string} player 
 * @returns {boolean} True if removed, false if not found
 */
export const removePlayerFromRoster = (teamName, player) => {
    const team = teamName.toLowerCase();
    const currentRoster = getRoster(team);
    
    if (!currentRoster.includes(player)) {
        return false; // Not on roster
    }
    
    rosters.set(team, currentRoster.filter(p => p !== player));
    return true;
};

/**
 * Get a list of all active teams
 * @returns {Array} Array of team names
 */
export const getAllTeams = () => {
    return Array.from(rosters.keys());
};
