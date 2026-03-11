/**
 * POST /api/track — Lightweight client-side event tracking
 * Logs page views and custom events to the database.
 * Admin paths (/admin/*) are always excluded.
 */

import { NextResponse } from "next/server";
import { logPageView, logAnalyticsEvent, logReferrerHit } from "@/lib/db";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { event, page, metadata, referrer } = body;

        if (!event || typeof event !== "string") {
            return NextResponse.json(
                { error: "Event type is required" },
                { status: 400 }
            );
        }

        // Silently ignore admin paths — don't pollute analytics
        if (page && (page as string).startsWith("/admin")) {
            return NextResponse.json({ ok: true, skipped: true });
        }

        // Log page view
        if (event === "page_view" && page) {
            await logPageView(page);

            // Log referrer if this is a fresh session arrival (referrer from external domain)
            if (referrer && typeof referrer === "string" && referrer.length > 0) {
                try {
                    const referrerHost = new URL(referrer).hostname.replace(/^www\./, "");
                    const ownHost = "remitiq.co";
                    // Only log external referrers (not internal navigation)
                    if (!referrerHost.includes(ownHost) && !referrerHost.includes("localhost")) {
                        await logReferrerHit(referrer, page);
                    }
                } catch {
                    // Malformed referrer URL — skip silently
                }
            }
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
