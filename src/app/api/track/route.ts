/**
 * POST /api/track — Lightweight client-side event tracking
 * Logs page views and custom events to the database.
 */

import { NextResponse } from "next/server";
import { logPageView, logAnalyticsEvent } from "@/lib/db";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { event, page, metadata } = body;

        if (!event || typeof event !== "string") {
            return NextResponse.json(
                { error: "Event type is required" },
                { status: 400 }
            );
        }

        // Log page view
        if (event === "page_view" && page) {
            await logPageView(page);
        }

        // Log analytics event
        await logAnalyticsEvent(
            event,
            page || undefined,
            metadata ? JSON.stringify(metadata) : undefined
        );

        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (error) {
        console.error("[Track] Error logging event:", error);
        return NextResponse.json(
            { error: "Failed to log event" },
            { status: 500 }
        );
    }
}
