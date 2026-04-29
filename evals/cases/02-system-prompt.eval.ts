/**
 * Eval Suite 02 — System Prompt Quality
 * =======================================
 * Tests RemitIQ's system prompt builder (src/lib/ai/system-prompt.ts).
 *
 * WHY EVAL THE SYSTEM PROMPT?
 *   The system prompt is the foundation of every Claude interaction. If it's
 *   missing required data (like the live rate or signal), Claude can't answer
 *   factual questions correctly — regardless of how good the model is.
 *
 *   These evals are "prompt regression tests" — they guard against changes
 *   that accidentally remove critical sections from the system prompt.
 *
 * WHAT WE'RE TESTING:
 *   - Is live market data injected when context is available?
 *   - Is the "unavailable" fallback used when context is null?
 *   - Are all required sections present (platform guide, response rules)?
 *   - Are currency-specific values filled in correctly?
 *
 * GRADER USED: "contains" and "not-contains" (string checks, no API calls)
 */

import { buildSystemPrompt } from "../../src/lib/ai/system-prompt";
import { runSuite } from "../runner";
import type { EvalCase, RateContext } from "../../src/lib/chat-knowledge";

// ─── Mock Contexts ────────────────────────────────────────────────────────────

type PromptInput = {
  ctx: RateContext | null;
  currency: string;
  country: string;
};

const AUD_CTX: RateContext = {
  midMarketRate: 83.45,
  current: 83.20,
  avg30d: 82.50,
  high30d: 84.10,
  low30d: 81.80,
  weekChange: 0.45,
  weekChangePct: 0.54,
  rsi14: 62.3,
  volatility30d: 0.68,
  percentile30d: 72,
  macdLine: 0.042,
  macdSignal: 0.018,
  sma7: 83.10,
  sma20: 82.60,
  signal: "SEND_NOW",
  confidence: 76,
  reason: "Rate is above 30-day average with bullish momentum",
  backtestAccuracy: 78,
  dataSource: "live",
};

const USD_CTX: RateContext = {
  ...AUD_CTX,
  midMarketRate: 83.92,
  current: 83.75,
  signal: "WAIT",
  confidence: 65,
  dataSource: "cached",
};

const URGENT_CTX: RateContext = {
  ...AUD_CTX,
  signal: "URGENT",
  confidence: 88,
  percentile30d: 92,
};

// ─── Test Cases ───────────────────────────────────────────────────────────────

const cases: EvalCase<PromptInput>[] = [
  // ── Null context (fallback) ──
  {
    id: "prompt-01a",
    description: "Null context → 'Currently unavailable' fallback message",
    input: { ctx: null, currency: "AUD", country: "Australia" },
    graders: [
      { type: "contains", expected: "Currently unavailable" },
      // Should NOT have actual rate numbers without a ctx
      { type: "not-contains", expected: "Mid-market rate:" },
    ],
  },
  {
    id: "prompt-01b",
    description: "Null context → still mentions currency in the persona",
    input: { ctx: null, currency: "GBP", country: "United Kingdom" },
    graders: [
      { type: "contains", expected: "GBP" },
      { type: "contains", expected: "United Kingdom" },
    ],
  },

  // ── Live data injection ──
  {
    id: "prompt-02a",
    description: "With AUD ctx → mid-market rate injected",
    input: { ctx: AUD_CTX, currency: "AUD", country: "Australia" },
    graders: [
      { type: "contains", expected: "83.4500" }, // toFixed(4) of 83.45
      { type: "contains", expected: "Mid-market rate:" },
    ],
  },
  {
    id: "prompt-02b",
    description: "With AUD ctx → signal and confidence injected",
    input: { ctx: AUD_CTX, currency: "AUD", country: "Australia" },
    graders: [
      { type: "contains", expected: "SEND_NOW" },
      { type: "contains", expected: "76%" }, // confidence
    ],
  },
  {
    id: "prompt-02c",
    description: "With AUD ctx → RSI value injected with interpretation",
    input: { ctx: AUD_CTX, currency: "AUD", country: "Australia" },
    graders: [
      { type: "contains", expected: "62.3" }, // rsi14
      { type: "regex", pattern: "neutral|overbought|oversold" },
    ],
  },
  {
    id: "prompt-02d",
    description: "With AUD ctx → MACD bullish crossover noted",
    input: { ctx: AUD_CTX, currency: "AUD", country: "Australia" },
    graders: [
      // macdLine (0.042) > macdSignal (0.018) → bullish crossover
      { type: "contains", expected: "bullish crossover" },
    ],
  },
  {
    id: "prompt-02e",
    description: "With AUD ctx → SMA comparison (sma7 > sma20 = positive)",
    input: { ctx: AUD_CTX, currency: "AUD", country: "Australia" },
    graders: [
      { type: "contains", expected: "short-term above long-term" },
    ],
  },
  {
    id: "prompt-02f",
    description: "With USD ctx → different currency injected",
    input: { ctx: USD_CTX, currency: "USD", country: "United States" },
    graders: [
      { type: "contains", expected: "USD" },
      { type: "contains", expected: "WAIT" },
      { type: "contains", expected: "cached" },
    ],
  },
  {
    id: "prompt-02g",
    description: "With URGENT ctx → URGENT signal injected",
    input: { ctx: URGENT_CTX, currency: "AUD", country: "Australia" },
    graders: [
      { type: "contains", expected: "URGENT" },
      { type: "contains", expected: "88%" }, // confidence
    ],
  },
  {
    id: "prompt-02h",
    description: "With ctx → 30d percentile injected",
    input: { ctx: AUD_CTX, currency: "AUD", country: "Australia" },
    graders: [
      // percentile30d = 72
      { type: "contains", expected: "72" },
      { type: "contains", expected: "30-day percentile" },
    ],
  },

  // ── Required sections always present ──
  {
    id: "prompt-03a",
    description: "Always has Platform Quick Reference section",
    input: { ctx: null, currency: "AUD", country: "Australia" },
    graders: [
      { type: "contains", expected: "Platform Quick Reference" },
      { type: "contains", expected: "Wise" },
      { type: "contains", expected: "Remitly" },
      { type: "contains", expected: "Western Union" },
    ],
  },
  {
    id: "prompt-03b",
    description: "Always has Signal Reference section",
    input: { ctx: null, currency: "AUD", country: "Australia" },
    graders: [
      { type: "contains", expected: "Signal Reference" },
      { type: "contains", expected: "SEND_NOW" },
      { type: "contains", expected: "WAIT" },
      { type: "contains", expected: "URGENT" },
    ],
  },
  {
    id: "prompt-03c",
    description: "Always has response guidelines (150 words, be specific)",
    input: { ctx: null, currency: "AUD", country: "Australia" },
    graders: [
      { type: "contains", expected: "150 words" },
      { type: "contains", expected: "Be specific" },
    ],
  },
  {
    id: "prompt-03d",
    description: "Always has accuracy guidance (75-80%)",
    input: { ctx: null, currency: "AUD", country: "Australia" },
    graders: [
      { type: "contains", expected: "75-80%" },
      { type: "contains", expected: "180 days" },
    ],
  },
  {
    id: "prompt-03e",
    description: "Always instructs Claude to never invent rates",
    input: { ctx: null, currency: "AUD", country: "Australia" },
    graders: [
      { type: "regex", pattern: "never invent|Never invent" },
    ],
  },
];

// ─── Runner ───────────────────────────────────────────────────────────────────

export async function runSystemPromptSuite() {
  return runSuite(
    "02 — System Prompt Quality",
    "Tests buildSystemPrompt() — verifies live data injection and required sections. Fast, free, no API calls.",
    cases,
    async ({ ctx, currency, country }: PromptInput) => {
      return buildSystemPrompt(ctx, currency, country);
    }
  );
}
