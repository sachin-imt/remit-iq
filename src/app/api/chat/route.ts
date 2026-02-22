import { NextResponse } from "next/server";
import { matchIntent } from "@/lib/chat-knowledge";
import type { RateContext } from "@/lib/chat-knowledge";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const message: string = body.message || "";

        if (!message.trim()) {
            return NextResponse.json({
                reply: "Please type a question about AUD/INR rates or remittances!",
                suggestions: ["What's the current rate?", "What does confidence % mean?", "Which platform is cheapest?"],
            });
        }

        // Fetch live rate context for dynamic responses
        let ctx: RateContext | null = null;
        try {
            const rateRes = await fetch(new URL("/api/rates", request.url).toString());
            if (rateRes.ok) {
                const data = await rateRes.json();
                ctx = {
                    midMarketRate: data.midMarketRate,
                    current: data.stats.current,
                    avg30d: data.stats.avg30d,
                    high30d: data.stats.high30d,
                    low30d: data.stats.low30d,
                    weekChange: data.stats.weekChange,
                    weekChangePct: data.stats.weekChangePct,
                    rsi14: data.stats.rsi14,
                    volatility30d: data.stats.volatility30d,
                    percentile30d: data.stats.percentile30d,
                    macdLine: data.stats.macdLine,
                    macdSignal: data.stats.macdSignal,
                    sma7: data.stats.sma7,
                    sma20: data.stats.sma20,
                    signal: data.recommendation.signal,
                    confidence: data.recommendation.confidence,
                    reason: data.recommendation.reason,
                    backtestAccuracy: data.backtest.accuracy,
                    dataSource: data.dataSource,
                };
            }
        } catch {
            // Continue without context — responses will still work
        }

        const response = matchIntent(message, ctx);
        return NextResponse.json(response);
    } catch (error) {
        console.error("[RemitIQ Chat] Error:", error);
        return NextResponse.json(
            { reply: "Sorry, something went wrong. Please try again.", suggestions: [] },
            { status: 500 }
        );
    }
}
