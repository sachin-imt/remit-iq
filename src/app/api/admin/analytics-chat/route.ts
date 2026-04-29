/**
 * POST /api/admin/analytics-chat
 * Natural-language Q&A for the RemitIQ analytics dashboard.
 * Fetches live database context → sends to OpenAI → streams back an answer.
 */

import { NextResponse } from "next/server";
import { getAnalyticsSummary } from "@/lib/db";
import { buildAnalyticsSystemPrompt } from "@/lib/ai/analytics-system-prompt";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "remitiq-admin-2026";

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
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

        // Fetch only 7 days for maximum efficiency
        const analyticsData = await getAnalyticsSummary('7d');
        const systemPrompt = buildAnalyticsSystemPrompt(analyticsData);

        // Minimal history (last 2 turns)
        const messages = [
            { role: "system", content: systemPrompt },
            ...history.slice(-2).map((m: ChatMessage) => ({ role: m.role, content: m.content })),
            { role: "user", content: message },
        ];

        let retries = 0;
        const maxRetries = 2;

        while (retries <= maxRetries) {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 12000); 

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
                        max_tokens: 300,
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
                    // Increased backoff for low RPM accounts
                    const wait = retries * 5000; 
                    console.warn(`[Analytics AI] Rate limited. Waiting ${wait}ms...`);
                    await new Promise(r => setTimeout(r, wait));
                    continue;
                }

                const errStatus = openaiRes.status;
                const errText = await openaiRes.text();
                console.error(`[Analytics Chat] OpenAI error (${errStatus}):`, errText);
                
                if (errStatus === 401) return NextResponse.json({ error: "OpenAI API Key Error" }, { status: 500 });
                if (errStatus === 429) {
                    const isQuota = errText.toLowerCase().includes("quota") || errText.toLowerCase().includes("insufficient");
                    return NextResponse.json({ 
                        error: isQuota 
                            ? "OpenAI Quota Exceeded. Please check your billing/credits." 
                            : "AI Rate limit reached. This usually happens on free OpenAI accounts. Please wait 1 minute." 
                    }, { status: 502 });
                }
                
                return NextResponse.json({ error: "AI service error" }, { status: 502 });
            } catch (fetchErr: any) {
                clearTimeout(timeout);
                if (fetchErr.name === 'AbortError') return NextResponse.json({ error: "AI timed out" }, { status: 504 });
                throw fetchErr;
            }
        }
    } catch (error) {
        console.error("[Analytics Chat] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
    return NextResponse.json({ error: "Failed to reach AI" }, { status: 500 });
}
