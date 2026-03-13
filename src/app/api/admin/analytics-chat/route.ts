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
    const { kpis, alertsByDay, pageViewsByDay, topPages, recentEvents, alertTypeDistribution } = data;

    // Compact data formats for token efficiency (14 days max)
    const alertTimeline = alertsByDay.slice(-14)
        .map(d => `${d.date.slice(5)}:${d.signups}(${d.unique_users})`)
        .join(",") || "none";

    const pvTimeline = pageViewsByDay.slice(-14)
        .map(d => `${d.date.slice(5)}:${d.views}`)
        .join(",") || "none";

    const topPagesList = topPages.slice(0, 5)
        .map((p, i) => `${i + 1}.${p.page_path}(${p.total_views})`)
        .join("; ");

    const recentEventsList = recentEvents.slice(0, 8)
        .map(e => `[${e.created_at.slice(11, 16)}] ${e.event_type} on ${e.page_path || ""}`)
        .join("\n");

    const alertDistArr = alertTypeDistribution.map(d => `${d.alert_type}:${d.count}`).join(", ");

    return `You are RemitIQ's Analytics AI. Answer questions about user growth, traffic, and system health.
Today: ${new Date().toISOString().slice(0, 10)}

METRICS: Users:${kpis.uniqueUsers}, Alerts:${kpis.totalAlerts}, Active:${kpis.activeAlerts}, PV_Today:${kpis.todayPageViews}, PV_Week:${kpis.weekPageViews}, Events:${kpis.totalEvents}
SIGNUPS(MM-DD:Count(Unique)): ${alertTimeline}
VIEWS(MM-DD:Count): ${pvTimeline}
TOP_PAGES: ${topPagesList}
ALERTS: ${alertDistArr}
EVENTS:
${recentEventsList}

CONTEXT:
- App is early-stage; most signups are automated Playwright tests (automated-test@remitiq.co).
- Organic traffic is pre-launch.
- Providers: Wise, Remitly, TorFX, OFX, Instarem, Western Union.
- Goal: Australians sending to India.

Reply CONCISELY (<150 words). Use bullets for lists. Be honest if data is missing. No financial advice.`;
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

        // Fetch 14 days of context for efficiency
        const analyticsData = await getAnalyticsSummary('14d');
        const systemPrompt = buildSystemPrompt(analyticsData);

        // Build message array (compact history)
        const messages = [
            { role: "system", content: systemPrompt },
            ...history.slice(-4).map((m: ChatMessage) => ({ role: m.role, content: m.content })),
            { role: "user", content: message },
        ];

        // Retry logic for rate limits
        let retries = 0;
        const maxRetries = 2;

        while (retries <= maxRetries) {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);

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
                        max_tokens: 400,
                        temperature: 0.3,
                    }),
                });

                clearTimeout(timeout);

                if (openaiRes.ok) {
                    const openaiData = await openaiRes.json();
                    const reply = openaiData.choices?.[0]?.message?.content ?? "No response.";
                    return NextResponse.json({ reply });
                }

                if (openaiRes.status === 429 && retries < maxRetries) {
                    retries++;
                    const wait = retries * 2000;
                    console.warn(`[Analytics AI] Rate limited. Retrying in ${wait}ms... (Attempt ${retries})`);
                    await new Promise(r => setTimeout(r, wait));
                    continue;
                }

                const errStatus = openaiRes.status;
                const errText = await openaiRes.text();
                console.error(`[Analytics Chat] OpenAI error (${errStatus}):`, errText);
                
                if (errStatus === 401) return NextResponse.json({ error: "OpenAI API Key Error" }, { status: 500 });
                if (errStatus === 429) return NextResponse.json({ error: "Rate limit exceeded. Please try again in 1 minute." }, { status: 502 });
                
                return NextResponse.json({ error: "AI service error" }, { status: 502 });
            } catch (fetchErr: any) {
                clearTimeout(timeout);
                if (fetchErr.name === 'AbortError') {
                    console.error("[Analytics Chat] OpenAI request timed out");
                    return NextResponse.json({ error: "AI timed out" }, { status: 504 });
                }
                throw fetchErr;
            }
        }
    } catch (error) {
        console.error("[Analytics Chat] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
    return NextResponse.json({ error: "Failed to reach AI" }, { status: 500 });
}
