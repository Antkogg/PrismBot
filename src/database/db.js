import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_PATH  = path.join(DATA_DIR, 'prism.db');

let _db = null;

export const initDatabase = () => {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');

    // ── vc_guild_settings ─────────────────────────────────────────────────────
    _db.exec(`
        CREATE TABLE IF NOT EXISTS vc_guild_settings (
            guild_id              TEXT    PRIMARY KEY,
            category_id           TEXT,
            join_channel_id       TEXT,
            default_name_template TEXT    NOT NULL DEFAULT '{display_name}''s VC',
            default_user_limit    INTEGER NOT NULL DEFAULT 0,
            default_bitrate       INTEGER NOT NULL DEFAULT 64000,
            default_region        TEXT,
            interface_enabled     INTEGER NOT NULL DEFAULT 1,
            created_at            TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at            TEXT    NOT NULL DEFAULT (datetime('now'))
        )
    `);

    // ── vc_temp_channels ──────────────────────────────────────────────────────
    _db.exec(`
        CREATE TABLE IF NOT EXISTS vc_temp_channels (
            channel_id     TEXT    PRIMARY KEY,
            guild_id       TEXT    NOT NULL,
            owner_id       TEXT    NOT NULL,
            name           TEXT    NOT NULL,
            locked         INTEGER NOT NULL DEFAULT 0,
            hidden         INTEGER NOT NULL DEFAULT 0,
            user_limit     INTEGER NOT NULL DEFAULT 0,
            created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
            last_active_at TEXT    NOT NULL DEFAULT (datetime('now'))
        )
    `);

    // ── vc_permissions ────────────────────────────────────────────────────────
    _db.exec(`
        CREATE TABLE IF NOT EXISTS vc_permissions (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id        TEXT    NOT NULL,
            channel_id      TEXT    NOT NULL,
            user_id         TEXT    NOT NULL,
            permission_type TEXT    NOT NULL CHECK(permission_type IN ('permit','reject')),
            created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
            UNIQUE(channel_id, user_id)
        )
    `);

    // ── welcome_config ────────────────────────────────────────────────────────
    _db.exec(`
        CREATE TABLE IF NOT EXISTS welcome_config (
            key   TEXT PRIMARY KEY,
            value TEXT
        )
    `);

    logger.info(`[DB] SQLite initialized at ${DB_PATH}`);
    return _db;
};

export const getDb = () => {
    if (!_db) throw new Error('Database not initialized. Call initDatabase() first.');
    return _db;
};
