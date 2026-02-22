/**
 * RemitIQ Database Layer — SQLite via better-sqlite3
 * ====================================================
 * Persists daily AUD/INR rates and caches pre-computed intelligence.
 * Zero config: auto-creates the DB file and tables on first access.
 */

import Database from "better-sqlite3";
import path from "path";

// ─── Database Connection (singleton) ────────────────────────────────────────

// On Vercel (serverless), only /tmp is writable. In development, use local data/ dir.
const isVercel = !!process.env.VERCEL;
const DB_PATH = isVercel
    ? path.join("/tmp", "remitiq.db")
    : path.join(process.cwd(), "data", "remitiq.db");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
    if (_db) return _db;

    // Ensure data directory exists
    const fs = require("fs");
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL"); // Better concurrent read performance
    _db.pragma("busy_timeout = 5000");

    // Auto-create tables
    _db.exec(`
        CREATE TABLE IF NOT EXISTS daily_rates (
            date TEXT PRIMARY KEY,
            mid_market REAL NOT NULL,
            best_rate REAL NOT NULL,
            source TEXT NOT NULL DEFAULT 'frankfurter',
            fetched_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS platform_rates (
            date TEXT NOT NULL,
            platform_id TEXT NOT NULL,
            rate REAL NOT NULL,
            fee REAL NOT NULL DEFAULT 0,
            margin_pct REAL NOT NULL DEFAULT 0,
            source TEXT NOT NULL DEFAULT 'estimated',
            PRIMARY KEY (date, platform_id)
        );

        CREATE TABLE IF NOT EXISTS intelligence_cache (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            computed_at TEXT NOT NULL,
            mid_market_rate REAL NOT NULL,
            data_json TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_daily_rates_date
        ON daily_rates(date DESC);

        CREATE INDEX IF NOT EXISTS idx_platform_rates_date
        ON platform_rates(date DESC, platform_id);

        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            target_rate REAL NOT NULL,
            alert_type TEXT NOT NULL DEFAULT 'both',
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            triggered_at TEXT,
            trigger_rate REAL
        );

        CREATE INDEX IF NOT EXISTS idx_alerts_active
        ON alerts(is_active, target_rate);
    `);

    return _db;
}

// ─── Daily Rates ────────────────────────────────────────────────────────────

export interface DailyRate {
    date: string;
    mid_market: number;
    best_rate: number;
    source: string;
    fetched_at: string;
}

/**
 * Insert a daily rate. Skips if the date already exists (IGNORE).
 * Returns true if a new row was inserted.
 */
export function insertDailyRate(
    date: string,
    midMarket: number,
    bestRate: number,
    source: string = "frankfurter"
): boolean {
    const db = getDb();
    const stmt = db.prepare(`
        INSERT OR IGNORE INTO daily_rates (date, mid_market, best_rate, source, fetched_at)
        VALUES (?, ?, ?, ?, datetime('now'))
    `);
    const result = stmt.run(date, midMarket, bestRate, source);
    return result.changes > 0;
}

/**
 * Bulk-insert multiple daily rates (used for seeding historical data).
 * Uses a transaction for performance.
 */
export function insertDailyRatesBulk(
    rates: Array<{ date: string; midMarket: number; bestRate: number; source?: string }>
): number {
    const db = getDb();
    const stmt = db.prepare(`
        INSERT OR IGNORE INTO daily_rates (date, mid_market, best_rate, source, fetched_at)
        VALUES (?, ?, ?, ?, datetime('now'))
    `);

    let inserted = 0;
    const transaction = db.transaction(() => {
        for (const r of rates) {
            const result = stmt.run(r.date, r.midMarket, r.bestRate, r.source || "frankfurter");
            if (result.changes > 0) inserted++;
        }
    });

    transaction();
    return inserted;
}

/**
 * Get the most recent N days of rates, ordered chronologically (oldest first).
 */
export function getRecentRates(days: number = 180): DailyRate[] {
    const db = getDb();
    const rows = db.prepare(`
        SELECT date, mid_market, best_rate, source, fetched_at
        FROM daily_rates
        ORDER BY date DESC
        LIMIT ?
    `).all(days) as DailyRate[];

    return rows.reverse(); // Return in chronological order
}

/**
 * Get the latest rate (most recent date).
 */
export function getLatestRate(): DailyRate | null {
    const db = getDb();
    return (db.prepare(`
        SELECT date, mid_market, best_rate, source, fetched_at
        FROM daily_rates
        ORDER BY date DESC
        LIMIT 1
    `).get() as DailyRate) || null;
}

/**
 * Get total count of persisted rates.
 */
export function getRateCount(): number {
    const db = getDb();
    const row = db.prepare("SELECT COUNT(*) as count FROM daily_rates").get() as { count: number };
    return row.count;
}

// ─── Intelligence Cache ─────────────────────────────────────────────────────

/**
 * Cache pre-computed intelligence data (replaces previous cache).
 */
export function cacheIntelligence(midMarketRate: number, data: object): void {
    const db = getDb();
    db.prepare(`
        INSERT OR REPLACE INTO intelligence_cache (id, computed_at, mid_market_rate, data_json)
        VALUES (1, datetime('now'), ?, ?)
    `).run(midMarketRate, JSON.stringify(data));
}

/**
 * Get cached intelligence. Returns null if no cache exists.
 */
export function getCachedIntelligence(): {
    computedAt: string;
    midMarketRate: number;
    data: Record<string, unknown>;
} | null {
    const db = getDb();
    const row = db.prepare(`
        SELECT computed_at, mid_market_rate, data_json
        FROM intelligence_cache
        WHERE id = 1
    `).get() as { computed_at: string; mid_market_rate: number; data_json: string } | undefined;

    if (!row) return null;

    return {
        computedAt: row.computed_at,
        midMarketRate: row.mid_market_rate,
        data: JSON.parse(row.data_json),
    };
}

/**
 * Check if the intelligence cache is fresh (less than maxAgeHours old).
 */
export function isIntelligenceFresh(maxAgeHours: number = 24): boolean {
    const cached = getCachedIntelligence();
    if (!cached) return false;

    const computedAt = new Date(cached.computedAt + "Z"); // SQLite stores UTC
    const ageMs = Date.now() - computedAt.getTime();
    const ageHours = ageMs / (1000 * 60 * 60);

    return ageHours < maxAgeHours;
}

// ─── Platform Rates ─────────────────────────────────────────────────────────

export interface PlatformRate {
    date: string;
    platform_id: string;
    rate: number;
    fee: number;
    margin_pct: number;
    source: string;
}

/**
 * Insert per-platform rates for a given date (bulk, in transaction).
 */
export function insertPlatformRates(
    date: string,
    rates: Array<{ platformId: string; rate: number; fee: number; marginPct: number; source: string }>
): number {
    const db = getDb();
    const stmt = db.prepare(`
        INSERT OR REPLACE INTO platform_rates (date, platform_id, rate, fee, margin_pct, source)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    let inserted = 0;
    const transaction = db.transaction(() => {
        for (const r of rates) {
            stmt.run(date, r.platformId, r.rate, r.fee, r.marginPct, r.source);
            inserted++;
        }
    });

    transaction();
    return inserted;
}

/**
 * Get platform rates for a specific date.
 */
export function getPlatformRatesForDate(date: string): PlatformRate[] {
    const db = getDb();
    return db.prepare(`
        SELECT date, platform_id, rate, fee, margin_pct, source
        FROM platform_rates
        WHERE date = ?
        ORDER BY rate DESC
    `).all(date) as PlatformRate[];
}

// ─── Alerts ─────────────────────────────────────────────────────────────────

export interface Alert {
    id: number;
    email: string;
    target_rate: number;
    alert_type: string; // "rate" | "platform" | "both"
    is_active: number;
    created_at: string;
    triggered_at: string | null;
    trigger_rate: number | null;
}

/**
 * Insert a new rate alert.
 */
export function insertAlert(
    email: string,
    targetRate: number,
    alertType: string = "both"
): number {
    const db = getDb();
    const result = db.prepare(`
        INSERT INTO alerts (email, target_rate, alert_type)
        VALUES (?, ?, ?)
    `).run(email, targetRate, alertType);
    return result.lastInsertRowid as number;
}

/**
 * Get all active alerts that should trigger when rate >= target.
 */
export function getActiveRateAlerts(currentRate: number): Alert[] {
    const db = getDb();
    return db.prepare(`
        SELECT * FROM alerts
        WHERE is_active = 1
          AND (alert_type = 'rate' OR alert_type = 'both')
          AND target_rate <= ?
    `).all(currentRate) as Alert[];
}

/**
 * Get all active best-deal alerts.
 */
export function getActiveBestDealAlerts(): Alert[] {
    const db = getDb();
    return db.prepare(`
        SELECT * FROM alerts
        WHERE is_active = 1
          AND (alert_type = 'platform' OR alert_type = 'both')
    `).all() as Alert[];
}

/**
 * Mark an alert as triggered with the rate that triggered it.
 */
export function markAlertTriggered(id: number, triggerRate: number): void {
    const db = getDb();
    db.prepare(`
        UPDATE alerts
        SET is_active = 0, triggered_at = datetime('now'), trigger_rate = ?
        WHERE id = ?
    `).run(triggerRate, id);
}

/**
 * Get count of active alerts (for stats).
 */
export function getAlertCount(): { active: number; total: number } {
    const db = getDb();
    const active = (db.prepare("SELECT COUNT(*) as count FROM alerts WHERE is_active = 1").get() as { count: number }).count;
    const total = (db.prepare("SELECT COUNT(*) as count FROM alerts").get() as { count: number }).count;
    return { active, total };
}

