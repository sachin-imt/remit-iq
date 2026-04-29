/**
 * Eval Suite 04 — Claude Chat Quality (LLM-as-Judge)
 * ====================================================
 * Tests the actual Claude API responses in the "Ask RemitIQ" chat feature.
 *
 * WHY LLM-AS-JUDGE?
 *   Claude's responses are open-ended — they vary with each call. You can't
 *   check them with exact-match or even simple contains graders because:
 *     - The phrasing changes every run
 *     - Quality is subjective (helpful? accurate? well-structured?)
 *     - A response can be "correct" in many different ways
 *
 *   LLM-as-judge solves this: a fast, cheap judge model (haiku) reads each
 *   response and scores it against a plain-English criterion (1–5). It works
 *   the way a human reviewer would, but scales to thousands of test cases.
 *
 * KEY EVAL CATEGORIES:
 *   1. Factual accuracy — does Claude use data from the system prompt correctly?
 *   2. Signal communication — does it lead with SEND_NOW/WAIT/URGENT?
 *   3. Platform knowledge — does it mention the right platforms?
 *   4. Scope control — does it redirect off-topic questions?
 *   5. Hallucination prevention — does it avoid inventing rates?
 *   6. Response quality — is it concise, helpful, correctly structured?
 *
 * COST NOTE:
 *   Each case = 1 Claude call + 1 judge call (haiku) ≈ $0.003 total.
 *   Run this suite deliberately, not on every commit.
 *   Use suites 01–03 for CI; run suite 04 before major releases.
 */

import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "../../src/lib/ai/system-prompt";
import type { RateContext } from "../../src/lib/chat-knowledge";
import { runSuite } from "../runner";
import type { EvalCase } from "../types";

const anthropic = new Anthropic();

// ─── Mock Contexts ────────────────────────────────────────────────────────────

const SEND_NOW_CTX: RateContext = {
  midMarketRate: 83.45,
  current: 83.20,
  avg30d: 82.10,
  high30d: 83.90,
  low30d: 80.50,
  weekChange: 0.62,
  weekChangePct: 0.75,
  rsi14: 64.2,
  volatility30d: 0.72,
  percentile30d: 78,
  macdLine: 0.055,
  macdSignal: 0.021,
  sma7: 83.00,
  sma20: 82.20,
  signal: "SEND_NOW",
  confidence: 76,
  reason: "Rate is above 30-day average with bullish momentum indicators",
  backtestAccuracy: 78,
  dataSource: "live",
};

const WAIT_CTX: RateContext = {
  ...SEND_NOW_CTX,
  current: 81.50,
  avg30d: 82.50,
  percentile30d: 22,
  rsi14: 38.1,
  macdLine: -0.031,
  macdSignal: 0.010,
  sma7: 81.80,
  sma20: 82.60,
  signal: "WAIT",
  confidence: 68,
  reason: "Rate is below 30-day average — may recover in 3–7 days",
};

const URGENT_CTX: RateContext = {
  ...SEND_NOW_CTX,
  percentile30d: 93,
  confidence: 87,
  signal: "URGENT",
  reason: "Rate is in the top 7% of the past 30 days — unusually good",
};

// ─── Chat Call Helper ─────────────────────────────────────────────────────────

interface ChatInput {
  message: string;
  ctx: RateContext | null;
  currency?: string;
  country?: string;
}

async function callClaude(input: ChatInput): Promise<string> {
  const currency = input.currency ?? "AUD";
  const country = input.country ?? "Australia";
  const systemPrompt = buildSystemPrompt(input.ctx, currency, country);

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: "user", content: input.message }],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}

// ─── Test Cases ───────────────────────────────────────────────────────────────

export const cases: EvalCase<ChatInput>[] = [
  // ── Factual Accuracy ──

  {
    id: "llm-01a",
    description: "Rate question → Claude cites the actual rate from context (no invention)",
    input: { message: "What's the current AUD/INR rate?", ctx: SEND_NOW_CTX },
    graders: [
      {
        type: "llm-judge",
        criteria:
          "The response mentions a specific numeric exchange rate value that is close to 83 (within ±2 of 83.45). It should NOT invent a rate significantly different from this.",
        passMark: 4,
      },
      {
        type: "regex",
        pattern: "8[123456789]",  // Rate in the 80s range
      },
    ],
  },
  {
    id: "llm-01b",
    description: "30-day average question → Claude uses the avg30d from context (82.10)",
    input: {
      message: "What is the 30-day average AUD/INR rate?",
      ctx: SEND_NOW_CTX,
    },
    graders: [
      {
        type: "llm-judge",
        criteria:
          "The response mentions the 30-day average rate, which should be approximately 82.10 as provided in context.",
      },
    ],
  },

  // ── Signal Communication ──

  {
    id: "llm-02a",
    description: "Timing question with SEND_NOW signal → Claude leads with SEND NOW clearly",
    input: { message: "Should I send money now?", ctx: SEND_NOW_CTX },
    graders: [
      {
        type: "llm-judge",
        criteria:
          "The response clearly leads with or prominently states a 'SEND NOW' recommendation. It should mention the signal name or clearly say it's a good time to send.",
        passMark: 4,
      },
      {
        type: "llm-judge",
        criteria:
          "The response includes the confidence percentage (76%) or describes the confidence level.",
        passMark: 3,
      },
    ],
  },
  {
    id: "llm-02b",
    description: "Timing question with WAIT signal → Claude recommends waiting",
    input: { message: "Is now a good time to send money?", ctx: WAIT_CTX },
    graders: [
      {
        type: "llm-judge",
        criteria:
          "The response recommends WAITING or indicates this is not an ideal time to send. It should NOT strongly recommend sending now.",
        passMark: 4,
      },
    ],
  },
  {
    id: "llm-02c",
    description: "URGENT signal context → Claude conveys urgency to act quickly",
    input: { message: "What's your recommendation for sending today?", ctx: URGENT_CTX },
    graders: [
      {
        type: "llm-judge",
        criteria:
          "The response conveys urgency — it should say the rate is unusually good and suggest acting quickly or soon. Words like 'urgent', 'act quickly', 'don't wait', or 'today is a great day' should appear.",
        passMark: 4,
      },
    ],
  },
  {
    id: "llm-02d",
    description: "Timing question includes reason/indicator, not just the signal",
    input: { message: "Should I send money today?", ctx: SEND_NOW_CTX },
    graders: [
      {
        type: "llm-judge",
        criteria:
          "The response includes at least one specific reason for the recommendation (e.g. percentile, RSI, rate vs average, momentum). It should not just say 'yes send now' without any justification.",
        passMark: 4,
      },
    ],
  },

  // ── Platform Knowledge ──

  {
    id: "llm-03a",
    description: "Platform question → Claude mentions Wise as a top recommendation",
    input: { message: "Which platform gives me the best deal?", ctx: SEND_NOW_CTX },
    graders: [
      {
        type: "llm-judge",
        criteria:
          "The response mentions Wise as the best or top platform, or at least as one of the top-ranked options for AUD to INR transfers.",
        passMark: 4,
      },
      {
        type: "contains",
        expected: "Wise",
      },
    ],
  },
  {
    id: "llm-03b",
    description: "Fee question → Claude explains the margin matters more than flat fee",
    input: {
      message: "I'm trying to understand which platform has the lowest total cost — Wise charges a fee but others don't. How do I compare them?",
      ctx: SEND_NOW_CTX,
    },
    graders: [
      {
        type: "llm-judge",
        criteria:
          "The response explains that the FX margin (or exchange rate markup) often matters more than the flat fee, and helps the user understand total cost = fee + margin impact.",
        passMark: 4,
      },
    ],
  },

  // ── Scope Control (off-topic) ──

  {
    id: "llm-04a",
    description: "Off-topic: joke → Claude declines and redirects to remittances",
    input: { message: "Tell me a joke", ctx: null },
    graders: [
      {
        type: "llm-judge",
        criteria:
          "The response declines to tell a joke and redirects the user to ask about AUD/INR rates or money transfers instead. It should NOT actually tell a joke.",
        passMark: 4,
      },
      {
        type: "not-contains",
        expected: "Why did",  // typical joke opener
      },
    ],
  },
  {
    id: "llm-04b",
    description: "Off-topic: stock advice → Claude redirects to remittance topics",
    input: { message: "Should I buy Apple stock or Tesla?", ctx: null },
    graders: [
      {
        type: "llm-judge",
        criteria:
          "The response does not provide stock investment advice, and instead redirects the user to questions about exchange rates or money transfers.",
        passMark: 4,
      },
    ],
  },
  {
    id: "llm-04c",
    description: "Off-topic: weather → Claude redirects gracefully",
    input: { message: "What's the weather like in Melbourne today?", ctx: null },
    graders: [
      {
        type: "llm-judge",
        criteria:
          "The response does not discuss weather and redirects the user to remittance or exchange rate topics.",
        passMark: 4,
      },
    ],
  },

  // ── Hallucination Prevention ──

  {
    id: "llm-05a",
    description: "No context → Claude says it can't provide current rates",
    input: {
      message: "What is today's exact AUD/INR rate right now?",
      ctx: null,
    },
    graders: [
      {
        type: "llm-judge",
        criteria:
          "Without live rate context, the response should either say it doesn't have current live data, or point the user to the homepage. It should NOT invent or state a specific rate number as if it's definitely current.",
        passMark: 4,
      },
    ],
  },
  {
    id: "llm-05b",
    description: "Context has rate 83.45 → Claude doesn't quote rates far from this",
    input: {
      message: "What rate will Wise give me today?",
      ctx: SEND_NOW_CTX, // mid-market 83.45
    },
    graders: [
      {
        type: "llm-judge",
        criteria:
          "The response quotes a rate in the range of 82–85 for AUD/INR (consistent with the provided context of 83.45 mid-market). It should NOT claim a rate below 75 or above 90.",
        passMark: 4,
      },
    ],
  },

  // ── Response Quality ──

  {
    id: "llm-06a",
    description: "General question → response under 150 words (follows system prompt rules)",
    input: { message: "What is RSI and what does it mean for me?", ctx: SEND_NOW_CTX },
    graders: [
      {
        type: "llm-judge",
        criteria:
          "The response is concise — under 150 words. It explains RSI in plain English without excessive jargon.",
        passMark: 4,
      },
    ],
  },
  {
    id: "llm-06b",
    description: "Accuracy question → Claude mentions 75-80% backtest accuracy",
    input: { message: "How accurate are your recommendations?", ctx: SEND_NOW_CTX },
    graders: [
      {
        type: "llm-judge",
        criteria:
          "The response mentions the ~75-80% accuracy figure (or backtested accuracy), and presents it confidently as a useful signal. It should NOT be overly self-deprecating or compare it to a coin flip.",
        passMark: 4,
      },
      {
        type: "regex",
        pattern: "7[0-9]|8[0-9]|accuracy|backtest",
      },
    ],
  },
  {
    id: "llm-06c",
    description: "Financial advice question → includes disclaimer but remains helpful",
    input: {
      message: "Is this financial advice? Should I definitely follow your signals?",
      ctx: SEND_NOW_CTX,
    },
    graders: [
      {
        type: "llm-judge",
        criteria:
          "The response includes a clear disclaimer that this is NOT financial advice, mentions it's informational/guidance only, but still remains helpful and doesn't refuse to assist with rate questions.",
        passMark: 4,
      },
    ],
  },
  {
    id: "llm-06d",
    description: "Mid-market rate question → Claude explains the concept clearly in plain English",
    input: { message: "What is mid-market rate and why does it matter?", ctx: SEND_NOW_CTX },
    graders: [
      {
        type: "llm-judge",
        criteria:
          "The response explains that the mid-market rate is the 'true' or 'interbank' exchange rate that no consumer gets, and that remittance platforms add a margin on top. The explanation should be accessible to someone without finance knowledge.",
        passMark: 4,
      },
    ],
  },

  // ── Currency Context Switching ──

  {
    id: "llm-07a",
    description: "GBP context → Claude answers about GBP/INR, not AUD",
    input: {
      message: "Should I send GBP to India now?",
      ctx: { ...SEND_NOW_CTX, signal: "SEND_NOW" },
      currency: "GBP",
      country: "United Kingdom",
    },
    graders: [
      {
        type: "llm-judge",
        criteria:
          "The response is framed around GBP/INR and mentions the UK or GBP, not AUD or Australia.",
        passMark: 4,
      },
      {
        type: "contains",
        expected: "GBP",
      },
    ],
  },
];

// ─── Runner ───────────────────────────────────────────────────────────────────

export async function runChatLLMSuite() {
  return runSuite(
    "04 — Claude Chat Quality (LLM-as-Judge)",
    "Tests actual Claude API responses. Uses haiku as judge. Costs ~$0.003/case. Run before releases.",
    cases,
    async (input: ChatInput) => callClaude(input)
  );
}
