/**
 * RemitIQ Database Layer — Neon Postgres (Serverless)
 * ====================================================
 * Persists daily AUD/INR rates and caches pre-computed intelligence.
 * Auto-creates tables on first access via ensureTables().
 * Requires POSTGRES_URL (or DATABASE_URL) environment variable.
 */

import { neon } from "@neondatabase/serverless";
import { PROVIDER_DEFINITIONS } from "@/data/platforms";

// ─── Database Connection ─────────────────────────────────────────────────────

function getSQL() {
    const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!url) {
        throw new Error("[RemitIQ DB] POSTGRES_URL or DATABASE_URL environment variable is required");
    }
    return neon(url);
}

let _initialized = false;

async function ensureTables(): Promise<void> {
    if (_initialized) return;

    const sql = getSQL();

    await sql`
        CREATE TABLE IF NOT EXISTS daily_rates (
            date TEXT PRIMARY KEY,
            mid_market DOUBLE PRECISION NOT NULL,
            best_rate DOUBLE PRECISION NOT NULL,
            source TEXT NOT NULL DEFAULT 'frankfurter',
            fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_daily_rates_date ON daily_rates(date DESC)`;

    await sql`
        CREATE TABLE IF NOT EXISTS platform_rates (
            date TEXT NOT NULL,
            platform_id TEXT NOT NULL,
            rate DOUBLE PRECISION NOT NULL,
            fee DOUBLE PRECISION NOT NULL DEFAULT 0,
            margin_pct DOUBLE PRECISION NOT NULL DEFAULT 0,
            source TEXT NOT NULL DEFAULT 'estimated',
            PRIMARY KEY (date, platform_id)
        )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_platform_rates_date ON platform_rates(date DESC, platform_id)`;

    await sql`
        CREATE TABLE IF NOT EXISTS intelligence_cache (
            id INT PRIMARY KEY DEFAULT 1,
            computed_at TIMESTAMPTZ NOT NULL,
            mid_market_rate DOUBLE PRECISION NOT NULL,
            data_json TEXT NOT NULL
        )
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS provider_configs (
            platform_id TEXT PRIMARY KEY,
            margin_pct DOUBLE PRECISION NOT NULL DEFAULT 0,
            base_fee DOUBLE PRECISION NOT NULL DEFAULT 0,
            fee_pct DOUBLE PRECISION NOT NULL DEFAULT 0,
            promo_margin_pct DOUBLE PRECISION,
            promo_cap DOUBLE PRECISION,
            last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS alerts (
            id SERIAL PRIMARY KEY,
            email TEXT NOT NULL,
            target_rate DOUBLE PRECISION NOT NULL,
            alert_type TEXT NOT NULL DEFAULT 'both',
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            triggered_at TIMESTAMPTZ,
            trigger_rate DOUBLE PRECISION
        )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(is_active, target_rate)`;

    await sql`
        CREATE TABLE IF NOT EXISTS api_keys (
            id SERIAL PRIMARY KEY,
            key_hash TEXT NOT NULL UNIQUE,
            client_name TEXT NOT NULL,
            tier TEXT NOT NULL DEFAULT 'freemium',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS verification_codes (
            id SERIAL PRIMARY KEY,
            email TEXT NOT NULL,
            code_hash TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            expires_at TIMESTAMPTZ NOT NULL,
            used BOOLEAN NOT NULL DEFAULT FALSE,
            used_for TEXT
        )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email, created_at)`;

    _initialized = true;
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
 * Insert a daily rate. Skips if the date already exists.
 * Returns true if a new row was inserted.
 */
export async function insertDailyRate(
    date: string,
    midMarket: number,
    bestRate: number,
    source: string = "frankfurter"
): Promise<boolean> {
    await ensureTables();
    const sql = getSQL();
    const result = await sql`
        INSERT INTO daily_rates (date, mid_market, best_rate, source, fetched_at)
        VALUES (${date}, ${midMarket}, ${bestRate}, ${source}, NOW())
        ON CONFLICT (date) DO NOTHING
    `;
    return result.length > 0;
}

/**
 * Bulk-insert multiple daily rates (used for seeding historical data).
 */
export async function insertDailyRatesBulk(
    rates: Array<{ date: string; midMarket: number; bestRate: number; source?: string }>
): Promise<number> {
    await ensureTables();
    const sql = getSQL();
    let inserted = 0;

    for (const r of rates) {
        try {
            await sql`
                INSERT INTO daily_rates (date, mid_market, best_rate, source, fetched_at)
                VALUES (${r.date}, ${r.midMarket}, ${r.bestRate}, ${r.source || "frankfurter"}, NOW())
                ON CONFLICT (date) DO NOTHING
            `;
            inserted++;
        } catch {
            // Skip duplicates
        }
    }

    return inserted;
}

/**
 * Get the most recent N days of rates, ordered chronologically (oldest first).
 */
export async function getRecentRates(days: number = 180): Promise<DailyRate[]> {
    await ensureTables();
    const sql = getSQL();
    const rows = await sql`
        SELECT date, mid_market, best_rate, source, fetched_at
        FROM daily_rates
        ORDER BY date DESC
        LIMIT ${days}
    `;
    return (rows as unknown as DailyRate[]).reverse();
}

/**
 * Get the latest rate (most recent date).
 */
export async function getLatestRate(): Promise<DailyRate | null> {
    await ensureTables();
    const sql = getSQL();
    const rows = await sql`
        SELECT date, mid_market, best_rate, source, fetched_at
        FROM daily_rates
        ORDER BY date DESC
        LIMIT 1
    `;
    return (rows[0] as unknown as DailyRate) || null;
}

/**
 * Get total count of persisted rates.
 */
export async function getRateCount(): Promise<number> {
    await ensureTables();
    const sql = getSQL();
    const rows = await sql`SELECT COUNT(*) as count FROM daily_rates`;
    return parseInt(rows[0].count as string);
}

// ─── Intelligence Cache ─────────────────────────────────────────────────────

/**
 * Cache pre-computed intelligence data (replaces previous cache).
 */
export async function cacheIntelligence(midMarketRate: number, data: object): Promise<void> {
    await ensureTables();
    const sql = getSQL();
    const dataJson = JSON.stringify(data);
    await sql`
        INSERT INTO intelligence_cache (id, computed_at, mid_market_rate, data_json)
        VALUES (1, NOW(), ${midMarketRate}, ${dataJson})
        ON CONFLICT (id) DO UPDATE SET
            computed_at = NOW(),
            mid_market_rate = ${midMarketRate},
            data_json = ${dataJson}
    `;
}

/**
 * Get cached intelligence. Returns null if no cache exists.
 */
export async function getCachedIntelligence(): Promise<{
    computedAt: string;
    midMarketRate: number;
    data: Record<string, unknown>;
} | null> {
    await ensureTables();
    const sql = getSQL();
    const rows = await sql`
        SELECT computed_at, mid_market_rate, data_json
        FROM intelligence_cache
        WHERE id = 1
    `;

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
        computedAt: row.computed_at as string,
        midMarketRate: parseFloat(row.mid_market_rate as string),
        data: JSON.parse(row.data_json as string),
    };
}

/**
 * Check if the intelligence cache is fresh (less than maxAgeHours old).
 */
export async function isIntelligenceFresh(maxAgeHours: number = 24): Promise<boolean> {
    const cached = await getCachedIntelligence();
    if (!cached) return false;

    const computedAt = new Date(cached.computedAt);
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
 * Insert per-platform rates for a given date (bulk).
 */
export async function insertPlatformRates(
    date: string,
    rates: Array<{ platformId: string; rate: number; fee: number; marginPct: number; source: string }>
): Promise<number> {
    await ensureTables();
    const sql = getSQL();
    let inserted = 0;

    for (const r of rates) {
        await sql`
            INSERT INTO platform_rates (date, platform_id, rate, fee, margin_pct, source)
            VALUES (${date}, ${r.platformId}, ${r.rate}, ${r.fee}, ${r.marginPct}, ${r.source})
            ON CONFLICT (date, platform_id) DO UPDATE SET
                rate = ${r.rate},
                fee = ${r.fee},
                margin_pct = ${r.marginPct},
                source = ${r.source}
        `;
        inserted++;
    }

    return inserted;
}

/**
 * Get platform rates for a specific date.
 */
export async function getPlatformRatesForDate(date: string): Promise<PlatformRate[]> {
    await ensureTables();
    const sql = getSQL();
    const rows = await sql`
        SELECT date, platform_id, rate, fee, margin_pct, source
        FROM platform_rates
        WHERE date = ${date}
        ORDER BY rate DESC
    `;
    return rows as unknown as PlatformRate[];
}

// ─── Provider Configs ───────────────────────────────────────────────────────

export interface ProviderConfig {
    platform_id: string;
    margin_pct: number;
    base_fee: number;
    fee_pct: number;
    promo_margin_pct: number | null;
    promo_cap: number | null;
    last_updated: string;
}

/**
 * Get all current provider configurations.
 * If empty, automatically seeds the database with the hardcoded platform definitions.
 */
export async function getProviderConfigs(): Promise<ProviderConfig[]> {
    await ensureTables();
    const sql = getSQL();

    const countRows = await sql`SELECT COUNT(*) as count FROM provider_configs`;
    const count = parseInt(countRows[0].count as string);

    if (count === 0) {
        console.log("[RemitIQ DB] Seeding initial provider configs");
        for (const p of PROVIDER_DEFINITIONS) {
            await updateProviderConfig(p.id, p.marginPct, p.baseFee, p.feePct, p.promoMarginPct, p.promoCap);
        }
    }

    const rows = await sql`
        SELECT platform_id, margin_pct, base_fee, fee_pct, promo_margin_pct, promo_cap, last_updated
        FROM provider_configs
    `;
    return rows as unknown as ProviderConfig[];
}

/**
 * Update configuration for a specific provider.
 */
export async function updateProviderConfig(
    platformId: string,
    marginPct: number,
    baseFee: number,
    feePct: number,
    promoMarginPct: number | null = null,
    promoCap: number | null = null
): Promise<void> {
    await ensureTables();
    const sql = getSQL();
    await sql`
        INSERT INTO provider_configs
        (platform_id, margin_pct, base_fee, fee_pct, promo_margin_pct, promo_cap, last_updated)
        VALUES (${platformId}, ${marginPct}, ${baseFee}, ${feePct}, ${promoMarginPct}, ${promoCap}, NOW())
        ON CONFLICT (platform_id) DO UPDATE SET
            margin_pct = ${marginPct},
            base_fee = ${baseFee},
            fee_pct = ${feePct},
            promo_margin_pct = ${promoMarginPct},
            promo_cap = ${promoCap},
            last_updated = NOW()
    `;
}

// ─── Alerts ─────────────────────────────────────────────────────────────────

export interface Alert {
    id: number;
    email: string;
    target_rate: number;
    alert_type: string;
    is_active: boolean;
    created_at: string;
    triggered_at: string | null;
    trigger_rate: number | null;
}

/**
 * Insert a new rate alert.
 */
export async function insertAlert(
    email: string,
    targetRate: number,
    alertType: string = "both"
): Promise<number> {
    await ensureTables();
    const sql = getSQL();
    const rows = await sql`
        INSERT INTO alerts (email, target_rate, alert_type)
        VALUES (${email}, ${targetRate}, ${alertType})
        RETURNING id
    `;
    return rows[0].id as number;
}

/**
 * Get all active alerts that should trigger when rate >= target.
 */
export async function getActiveRateAlerts(currentRate: number): Promise<Alert[]> {
    await ensureTables();
    const sql = getSQL();
    const rows = await sql`
        SELECT * FROM alerts
        WHERE is_active = TRUE
          AND (alert_type = 'rate' OR alert_type = 'both')
          AND target_rate <= ${currentRate}
    `;
    return rows as unknown as Alert[];
}

/**
 * Get all active best-deal alerts.
 */
export async function getActiveBestDealAlerts(): Promise<Alert[]> {
    await ensureTables();
    const sql = getSQL();
    const rows = await sql`
        SELECT * FROM alerts
        WHERE is_active = TRUE
          AND (alert_type = 'platform' OR alert_type = 'both')
    `;
    return rows as unknown as Alert[];
}

/**
 * Mark an alert as triggered with the rate that triggered it.
 */
export async function markAlertTriggered(id: number, triggerRate: number): Promise<void> {
    await ensureTables();
    const sql = getSQL();
    await sql`
        UPDATE alerts
        SET is_active = FALSE, triggered_at = NOW(), trigger_rate = ${triggerRate}
        WHERE id = ${id}
    `;
}

/**
 * Get count of active alerts (for stats).
 */
export async function getAlertCount(): Promise<{ active: number; total: number }> {
    await ensureTables();
    const sql = getSQL();
    const activeRows = await sql`SELECT COUNT(*) as count FROM alerts WHERE is_active = TRUE`;
    const totalRows = await sql`SELECT COUNT(*) as count FROM alerts`;
    return {
        active: parseInt(activeRows[0].count as string),
        total: parseInt(totalRows[0].count as string),
    };
}

// ─── API Keys (B2B) ─────────────────────────────────────────────────────────

export interface ApiKey {
    id: number;
    key_hash: string;
    client_name: string;
    tier: string;
    created_at: string;
}

/**
 * Insert a new API key.
 * Returns the plain-text key (which is only returned once) and the record ID.
 */
export async function createApiKey(clientName: string, tier: string = "freemium"): Promise<{ key: string; id: number }> {
    const crypto = require("crypto");
    const key = "rq_" + crypto.randomBytes(24).toString("hex");

    await ensureTables();
    const sql = getSQL();
    const rows = await sql`
        INSERT INTO api_keys (key_hash, client_name, tier)
        VALUES (${key}, ${clientName}, ${tier})
        RETURNING id
    `;

    return { key, id: rows[0].id as number };
}

/**
 * Validate an API key and return the associated client details if valid.
 */
export async function validateApiKey(key: string): Promise<ApiKey | null> {
    await ensureTables();
    const sql = getSQL();
    const rows = await sql`SELECT * FROM api_keys WHERE key_hash = ${key}`;
    return (rows[0] as unknown as ApiKey) || null;
}

// ─── Data Rights (GDPR/Privacy) ─────────────────────────────────────────────

/**
 * Create a verification code. Hashes the code with SHA-256 before storing.
 * Returns false if rate limit exceeded (3 per email per hour).
 */
export async function createVerificationCode(email: string, code: string): Promise<boolean> {
    const crypto = require("crypto");
    await ensureTables();
    const sql = getSQL();

    const rows = await sql`
        SELECT COUNT(*) as count FROM verification_codes
        WHERE email = ${email} AND created_at > NOW() - INTERVAL '1 hour'
    `;
    if (parseInt(rows[0].count as string) >= 3) return false;

    const codeHash = crypto.createHash("sha256").update(code).digest("hex");

    await sql`
        INSERT INTO verification_codes (email, code_hash, expires_at)
        VALUES (${email}, ${codeHash}, NOW() + INTERVAL '10 minutes')
    `;

    return true;
}

/**
 * Verify a code for a given email. Returns true if valid and not expired/used.
 * Marks the code as used on success.
 */
export async function verifyCode(email: string, code: string, usedFor: string): Promise<boolean> {
    const crypto = require("crypto");
    await ensureTables();
    const sql = getSQL();
    const codeHash = crypto.createHash("sha256").update(code).digest("hex");

    const rows = await sql`
        SELECT id FROM verification_codes
        WHERE email = ${email} AND code_hash = ${codeHash} AND used = FALSE AND expires_at > NOW()
        ORDER BY created_at DESC LIMIT 1
    `;

    if (rows.length === 0) return false;

    const id = rows[0].id;
    await sql`UPDATE verification_codes SET used = TRUE, used_for = ${usedFor} WHERE id = ${id}`;

    return true;
}

/**
 * Get all alerts for a given email address.
 */
export async function getAlertsByEmail(email: string): Promise<Alert[]> {
    await ensureTables();
    const sql = getSQL();
    const rows = await sql`SELECT * FROM alerts WHERE email = ${email}`;
    return rows as unknown as Alert[];
}

/**
 * Delete all alerts and verification codes for a given email address.
 * Returns count of deleted alert rows.
 */
export async function deleteAlertsByEmail(email: string): Promise<number> {
    await ensureTables();
    const sql = getSQL();
    const result = await sql`DELETE FROM alerts WHERE email = ${email}`;
    await sql`DELETE FROM verification_codes WHERE email = ${email}`;
    return result.length;
}
