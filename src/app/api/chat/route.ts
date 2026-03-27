/**
 * Phase 1: LLM-Powered Chat Route
 *
 * BEFORE (rule-based):
 *   message → matchIntent() → hardcoded regex response
 *
 * AFTER (LLM-powered):
 *   message → [fetch live rates] → buildSystemPrompt(rates) → Claude → response
 *
 * The key change: instead of pattern-matching the message, we give Claude
 * the live data as context and let it reason about the question naturally.
 *
 * The rate-fetching logic is IDENTICAL to before — we just pass the result
 * to Claude instead of a regex matcher.
 */

import { NextResponse } from "next/server";
import type { RateContext } from "@/lib/chat-knowledge";
import { anthropic, CHAT_MODEL } from "@/lib/ai/client";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message: string = body.message || "";
    const currencyCode: string = body.currencyCode || "AUD";
    const countryName: string = body.countryName || "Australia";

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

    // ── Step 1: Fetch live rate context (same as before) ──────────────────────
    // This calls your existing /api/rates endpoint, which runs all the
    // technical analysis (RSI, MACD, signal, etc.) you already built.
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
      // Continue without context — Claude will still answer from general knowledge
    }

    // ── Step 2: Build the system prompt with live data injected ───────────────
    // This is the core of Phase 1: formatting your computed data into
    // Claude's briefing so it can answer questions about it naturally.
    const systemPrompt = buildSystemPrompt(ctx, currencyCode, countryName);

    // ── Step 3: Call Claude ───────────────────────────────────────────────────
    // The messages array is just the user's question.
    // In Phase 5 (Memory), we'll pass the full conversation history here too.
    const response = await anthropic.messages.create({
      model: CHAT_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: message }],
    });

    // response.content is an array of blocks (text, tool_use, etc.)
    // For now we only have text responses — narrow by type before reading .text
    const reply =
      response.content[0].type === "text" ? response.content[0].text : "";

    // suggestions will come back in Phase 2 when we add tool calling
    return NextResponse.json({ reply, suggestions: [] });
  } catch (error) {
    console.error("[RemitIQ Chat] Error:", error);

    // Use the SDK's typed exceptions for specific error messages
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
