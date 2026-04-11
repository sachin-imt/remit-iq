import { NextResponse } from "next/server";
import type { RateContext } from "@/lib/chat-knowledge";
import { anthropic, CHAT_MODEL } from "@/lib/ai/client";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message: string = body.message || "";
    let currencyCode: string = body.currencyCode || "AUD";
    let countryName: string = body.countryName || "Australia";

    // Dynamic Context Override: If user explicitly asks about a different currency, switch context
    const msgUpper = message.toUpperCase();
    const currencyMap: Record<string, string> = {
        "AUD": "Australia", "USD": "United States", "GBP": "United Kingdom",
        "CAD": "Canada", "EUR": "Europe", "NZD": "New Zealand",
        "SGD": "Singapore", "MYR": "Malaysia", "HKD": "Hong Kong"
    };

    for (const [code, country] of Object.entries(currencyMap)) {
        if (msgUpper.match(new RegExp(`\\b${code}\\b`))) {
            currencyCode = code;
            countryName = country;
            break;
        }
    }

    if (!message.trim()) {
      return NextResponse.json({
        reply: `Please type a question about ${currencyCode}/INR rates or remittances!`,
        suggestions: [
          "What's the current rate?",
          "Should I send now?",
          "Which platform is cheapest?",
        ],
      });
    }

    // Fetch live rate context
    let ctx: RateContext | null = null;
    try {
      const rateRes = await fetch(
        new URL(`/api/rates?currency=${currencyCode}`, request.url).toString()
      );
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
      // Continue without context
    }

    const systemPrompt = buildSystemPrompt(ctx, currencyCode, countryName);

    const response = await anthropic.messages.create({
      model: CHAT_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: message }],
    });

    const reply =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ reply, suggestions: [] });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errType = error?.constructor?.name ?? "Unknown";
    console.error(`[RemitIQ Chat] ${errType}: ${errMsg}`);

    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { reply: "AI configuration error — please check the API key.", suggestions: [] },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { reply: "Sorry, something went wrong. Please try again.", suggestions: [] },
      { status: 500 }
    );
  }
}
