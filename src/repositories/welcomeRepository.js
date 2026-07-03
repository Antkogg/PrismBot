import { getDb } from '../database/db.js';

/**
 * Gets the configured welcome logo URL
 * @returns {string|null} The URL of the logo, or null if not set
 */
export const getWelcomeLogo = () => {
    const row = getDb().prepare("SELECT value FROM welcome_config WHERE key = 'logo_url'").get();
    return row ? row.value : null;
};

/**
 * Sets the configured welcome logo URL
 * @param {string} url The URL of the new logo
 */
export const setWelcomeLogo = (url) => {
    getDb().prepare(`
        INSERT INTO welcome_config (key, value) 
        VALUES ('logo_url', ?) 
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(url);
};

/**
 * Removes the configured welcome logo
 */
export const removeWelcomeLogo = () => {
    getDb().prepare("DELETE FROM welcome_config WHERE key = 'logo_url'").run();
};
