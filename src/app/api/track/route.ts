/**
 * POST /api/track — Lightweight client-side event tracking
 * Logs page views and custom events to the database.
 * Excludes: admin paths, bots, automation tools, headless browsers.
 */

import { NextResponse } from "next/server";
import { logPageView, logAnalyticsEvent, logReferrerHit } from "@/lib/db";

// Patterns that identify non-human traffic — drop silently
const BOT_PATTERNS = [
    /playwright/i,
    /puppeteer/i,
    /selenium/i,
    /cypress/i,
    /headless/i,
    /phantomjs/i,
    /HeadlessChrome/,
    /Googlebot/i,
    /Bingbot/i,
    /baiduspider/i,
    /YandexBot/i,
    /AhrefsBot/i,
    /SemrushBot/i,
    /DotBot/i,
    /MJ12bot/i,
    /facebookexternalhit/i,
    /Twitterbot/i,
    /LinkedInBot/i,
    /Slackbot/i,
    /WhatsApp/i,
    /curl\//i,
    /python-requests/i,
    /axios/i,
    /Go-http-client/i,
    /node-fetch/i,
    /vercel-edge/i,
    /Lighthouse/i,
    /GTmetrix/i,
    /Pingdom/i,
    /UptimeRobot/i,
    /Site24x7/i,
    /BetterStack/i,
    /Monitoring/i,
    /HealthCheck/i,
];

function isBot(request: Request): boolean {
    const userAgent = request.headers.get("user-agent") || "";
    
    // Check specific Vercel system headers
    const vercelId = request.headers.get("x-vercel-id");
    const isVercelCheck = !!vercelId;
    
    // Check internal remitiq headers
    const isInternal = !!request.headers.get("x-remitiq-internal") || !!request.headers.get("x-internal-test");

    if (!userAgent && !isVercelCheck && !isInternal) return true; // No UA and no system headers — treat as automated
    
    const matchesUA = BOT_PATTERNS.some(p => p.test(userAgent));
    
    return matchesUA || isVercelCheck || isInternal;
}

export async function POST(request: Request) {
    try {
        // Drop bot and automation traffic immediately — before any DB work
        if (isBot(request)) {
            return NextResponse.json({ ok: true, skipped: true });
        }

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

            // Log referrer on fresh external arrivals only
            if (referrer && typeof referrer === "string" && referrer.length > 0) {
                try {
                    const referrerHost = new URL(referrer).hostname.replace(/^www\./, "");
                    const ownHost = "remitiq.co";
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
