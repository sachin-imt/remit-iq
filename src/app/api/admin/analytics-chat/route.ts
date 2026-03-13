/**
 * POST /api/admin/analytics-chat
 * Natural-language Q&A for the RemitIQ analytics dashboard.
 * Fetches live database context → sends to OpenAI → streams back an answer.
 */

import { NextResponse } from "next/server";
import { getAnalyticsSummary } from "@/lib/db";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "remitiq-admin-2026";

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

function buildSystemPrompt(data: Awaited<ReturnType<typeof getAnalyticsSummary>>): string {
    const { kpis, alertsByDay, pageViewsByDay, topPages, recentEvents, alertTypeDistribution, systemHealth } = data;

    const alertTimeline = alertsByDay
        .map(d => `  ${d.date}: ${d.signups} signups (${d.unique_users} unique)`)
        .join("\n") || "  No signups yet";

    const pvTimeline = pageViewsByDay
        .map(d => `  ${d.date}: ${d.views} views`)
        .join("\n") || "  No data yet";

    const topPagesList = topPages
        .map((p, i) => `  ${i + 1}. ${p.page_path} — ${p.total_views} views`)
        .join("\n") || "  No data yet";

    const recentEventsList = recentEvents.slice(0, 10)
        .map(e => `  [${new Date(e.created_at).toISOString().slice(0, 16)}] ${e.event_type} on ${e.page_path || "?"} ${e.metadata ? `(${e.metadata})` : ""}`)
        .join("\n") || "  No events yet";

    const alertDist = alertTypeDistribution
        .map(d => `  ${d.alert_type}: ${d.count}`)
        .join("\n") || "  No data";

    return `You are an analytics assistant for RemitIQ — an AUD-to-INR money transfer comparison platform based in Australia. You have access to live database metrics and can answer any question about user growth, traffic, alerts, events, and system health.

Today's date: ${new Date().toISOString().slice(0, 10)}

=== KEY METRICS ===
Unique Users (alert subscribers): ${kpis.uniqueUsers}
Total Alerts: ${kpis.totalAlerts}
Active Alerts: ${kpis.activeAlerts}
Triggered Alerts: ${kpis.totalAlerts - kpis.activeAlerts}
Page Views — Today: ${kpis.todayPageViews} | This Week: ${kpis.weekPageViews} | All Time: ${kpis.totalPageViews}
Daily Exchange Rate Records in DB: ${kpis.totalRateRecords}
Total Tracked Events: ${kpis.totalEvents}

=== ALERT SIGNUPS (last 30 days, daily) ===
${alertTimeline}

=== PAGE VIEWS (last 30 days, daily) ===
${pvTimeline}

=== TOP PAGES (all time) ===
${topPagesList}

=== ALERT TYPE BREAKDOWN ===
${alertDist}

=== RECENT EVENTS (last 10) ===
${recentEventsList}

=== SYSTEM HEALTH ===
Latest exchange rate data: ${systemHealth.latestRateDate || "None"}
Intelligence cache: ${systemHealth.intelligenceFresh ? "Fresh (< 24h)" : "Stale (> 24h)"}
Providers configured in DB: ${systemHealth.totalProviders}

=== CONTEXT ===
- The app is early-stage; most alert signups are from automated Playwright E2E tests using automated-test@remitiq.co
- Organic users haven't arrived yet — the product is pre-launch
- The site compares 6 providers: Wise, Remitly, TorFX, OFX, Instarem, Western Union
- The team's goal is to attract Australians sending money to India

Answer questions concisely and helpfully. Use bullet points when listing items. If data is missing or zero, say so honestly and suggest what to look for. Don't invent numbers. Format numbers clearly (e.g. "48 alerts"). Keep responses under 200 words unless a longer breakdown is needed.`;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { message, history = [], key } = body as {
            message: string;
            history: ChatMessage[];
            key: string;
        };

        if (key !== ADMIN_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!message?.trim()) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        const openaiKey = process.env.OPENAI_API_KEY;
        if (!openaiKey) {
            return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
        }

        // Fetch fresh analytics data from DB
        const analyticsData = await getAnalyticsSummary();
        const systemPrompt = buildSystemPrompt(analyticsData);

        // Build message array for OpenAI
        const messages = [
            { role: "system", content: systemPrompt },
            // Include conversation history (last 6 turns)
            ...history.slice(-6).map((m: ChatMessage) => ({ role: m.role, content: m.content })),
            { role: "user", content: message },
        ];

        // Call OpenAI with timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

        try {
            const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${openaiKey}`,
                    "Content-Type": "application/json",
                },
                signal: controller.signal,
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages,
                    max_tokens: 600,
                    temperature: 0.4,
                }),
            });

            clearTimeout(timeout);

            if (!openaiRes.ok) {
                const errStatus = openaiRes.status;
                const errText = await openaiRes.text();
                console.error(`[Analytics Chat] OpenAI error (${errStatus}):`, errText);
                
                // Return a more descriptive error if it's a known issue
                if (errStatus === 401) return NextResponse.json({ error: "OpenAI configuration error (API Key)" }, { status: 500 });
                if (errStatus === 429) return NextResponse.json({ error: "AI rate limit exceeded" }, { status: 502 });
                
                return NextResponse.json({ error: "AI service error" }, { status: 502 });
            }

            const openaiData = await openaiRes.json();
            const reply = openaiData.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a response.";

            return NextResponse.json({ reply });
        } catch (fetchErr: any) {
            clearTimeout(timeout);
            if (fetchErr.name === 'AbortError') {
                console.error("[Analytics Chat] OpenAI request timed out after 15s");
                return NextResponse.json({ error: "AI response timed out" }, { status: 504 });
            }
            throw fetchErr;
        }
    } catch (error) {
        console.error("[Analytics Chat] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
