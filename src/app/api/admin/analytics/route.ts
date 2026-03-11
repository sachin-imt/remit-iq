/**
 * GET /api/admin/analytics — Admin analytics dashboard data
 * Protected by a simple secret key in query params.
 * Accepts ?period=1d|7d|14d|mtd|qtd|ytd (default: 7d)
 */

import { NextResponse } from "next/server";
import { getAnalyticsSummary } from "@/lib/db";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "remitiq-admin-2026";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    const period = searchParams.get("period") || "7d";

    if (key !== ADMIN_SECRET) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const data = await getAnalyticsSummary(period);
        return NextResponse.json(data, {
            headers: { "Cache-Control": "no-store, max-age=0" },
        });
    } catch (error) {
        console.error("[Admin Analytics] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch analytics" },
            { status: 500 }
        );
    }
}
