/**
 * Shared types for RemitIQ rate data.
 * Extracted to avoid circular dependencies between rate-service and intelligence.
 */

export interface RateDataPoint {
    date: string;
    day: string;
    rate: number;
    midMarket: number;
    volume?: number;
}
