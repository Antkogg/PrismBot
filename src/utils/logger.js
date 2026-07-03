/**
 * Simple logger utility for clean console output
 */
export default {
    info: (message) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`),
    warn: (message) => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`),
    error: (message, err) => {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
        if (err) console.error(err);
    }
};
