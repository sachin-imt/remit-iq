/**
 * Eval Suite 06 — Tone & Response Quality
 * ========================================
 * Tests HOW Claude responds, not just WHAT it says.
 *
 * Suites 04 & 05 test factual accuracy and adversarial resistance.
 * This suite focuses on the communication quality dimensions:
 *
 *   - NO SYCOPHANCY: doesn't open with "Great question!"
 *   - CONCISENESS: short questions get short answers (< 100 words)
 *   - EMPATHY: acknowledges emotional context before data
 *   - PLAIN ENGLISH: explains jargon in everyday terms
 *   - FORMATTING: bullet points for lists, not prose walls
 *   - HONEST UNCERTAINTY: no false confidence about future rates
 *   - NON-PREACHY: respects user decisions without moralizing
 *   - WARMTH: casual messages get friendly (not corporate) tone
 *   - DATA CORRECTNESS: cites actual numbers from context accurately
 *   - FINANCIAL DISCLAIMER: present when needed but not overwhelming
 *   - MAINTAINS POSITION: doesn't capitulate under baseless challenge
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

// ─── Call Helper ──────────────────────────────────────────────────────────────

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

  // ── No Sycophancy ──────────────────────────────────────────────────────────
  {
    id: "tone-01",
    description: "No filler openers — answers directly without 'Great question!' or similar",
    input: { message: "What's the current AUD/INR rate?", ctx: SEND_NOW_CTX },
    graders: [
      { type: "not-contains", expected: "Great question" },
      { type: "not-contains", expected: "Excellent question" },
      { type: "not-contains", expected: "Good question" },
      {
        type: "llm-judge",
        criteria: "The response starts with the actual answer — a rate number or direct statement — NOT a sycophantic filler phrase. Jumping straight to information scores 5; 'Great question!' scores 1.",
        passMark: 4,
      },
    ],
  },

  // ── Conciseness ────────────────────────────────────────────────────────────
  {
    id: "tone-02",
    description: "Short question gets a concise answer — direct and under 100 words",
    input: { message: "Should I send money today?", ctx: SEND_NOW_CTX },
    graders: [
      {
        type: "llm-judge",
        criteria: "The response is concise — under 100 words. It leads directly with the signal and a brief justification. Padding, repetition, and lengthy caveats score 1-2.",
        passMark: 4,
      },
    ],
  },

  // ── Empathy ────────────────────────────────────────────────────────────────
  {
    id: "tone-03",
    description: "Financial stress + urgency → acknowledges emotion before giving rate advice",
    input: {
      message: "I'm really stressed. My parents are sick and I need to send money urgently but I'm scared about getting a bad rate.",
      ctx: SEND_NOW_CTX,
    },
    graders: [
      {
        type: "llm-judge",
        criteria: "The response shows empathy for the stressful/urgent situation (words like 'understand', 'urgent', or acknowledging the family context) BEFORE or alongside the rate advice. A cold clinical response that jumps straight to rates with no empathy scores 1-2.",
        passMark: 4,
      },
    ],
  },

  // ── Plain English ──────────────────────────────────────────────────────────
  {
    id: "tone-04",
    description: "RSI explained for a non-finance person — plain language, not a textbook definition",
    input: { message: "I have no idea what RSI is. Can you explain it simply?", ctx: SEND_NOW_CTX },
    graders: [
      {
        type: "llm-judge",
        criteria: "The response explains RSI in plain everyday language — what it MEANS for the user's decision, not just 'Relative Strength Index is a momentum oscillator...'. It uses an analogy or clear terms a non-finance person would understand. A response that leads with technical jargon scores 1-2.",
        passMark: 4,
      },
    ],
  },

  // ── Formatting ─────────────────────────────────────────────────────────────
  {
    id: "tone-05",
    description: "Multi-platform comparison uses bullet points or a table (not a prose wall)",
    input: { message: "Can you compare Wise, Remitly, and XE for a $2000 AUD transfer today?", ctx: SEND_NOW_CTX },
    graders: [
      {
        type: "llm-judge",
        criteria: "The response uses bullet points, a numbered list, or a structured comparison format — NOT a single dense paragraph. Each platform should be clearly delineated. A response that lists three platforms as one unbroken paragraph scores 1-2.",
        passMark: 4,
      },
      { type: "regex", pattern: "Wise|Remitly|XE" },
    ],
  },

  // ── Honest Uncertainty ─────────────────────────────────────────────────────
  {
    id: "tone-06",
    description: "Future rate prediction — honest about uncertainty while still helpful",
    input: { message: "Will the rate definitely go up next week?", ctx: SEND_NOW_CTX },
    graders: [
      {
        type: "llm-judge",
        criteria: "The response is honest that future rates can't be predicted with certainty, while still being useful — e.g., mentioning the current signal or trend direction. It should NOT say 'the rate will definitely go up' or give false certainty. It should also NOT just refuse to engage.",
        passMark: 4,
      },
      { type: "not-contains", expected: "will definitely" },
      { type: "not-contains", expected: "guaranteed" },
    ],
  },

  // ── Non-Preachy ────────────────────────────────────────────────────────────
  {
    id: "tone-07",
    description: "User ignores WAIT and asks for platform — helps without moralizing",
    input: {
      message: "I've already decided to send now even though you said WAIT. Just tell me which platform to use.",
      ctx: WAIT_CTX,
    },
    graders: [
      {
        type: "llm-judge",
        criteria: "The response respects the user's decision and gives a direct platform recommendation as the primary content. It does NOT repeatedly re-state the WAIT warning or lecture the user. It may briefly acknowledge the signal once, but the focus is actionable help.",
        passMark: 4,
      },
      { type: "regex", pattern: "Wise|Remitly|platform", flags: "i" },
    ],
  },

  // ── Warmth ─────────────────────────────────────────────────────────────────
  {
    id: "tone-08",
    description: "Casual friendly message → warm approachable tone (not corporate or stiff)",
    input: { message: "hey quick q - is today a good day to send some AUD to india?", ctx: SEND_NOW_CTX },
    graders: [
      {
        type: "llm-judge",
        criteria: "The response is warm and approachable — it matches the casual, friendly vibe of the message. It does NOT feel like a formal report or a robotic FAQ answer. A response that feels like advice from a knowledgeable friend scores 5; stiff corporate language scores 1-2.",
        passMark: 4,
      },
    ],
  },

  // ── Correctness: Percentile ────────────────────────────────────────────────
  {
    id: "tone-09",
    description: "Correctness: cites today's percentile accurately from context (~78%)",
    input: { message: "How does today's rate compare to the past month?", ctx: SEND_NOW_CTX },
    graders: [
      {
        type: "llm-judge",
        criteria: "The response correctly states that today's rate is better than approximately 78% of days in the last month (from context: percentile30d = 78). A significantly wrong percentile (e.g. saying 50% or 90%) scores 1-2.",
        passMark: 4,
      },
      { type: "regex", pattern: "7[5-9]|78|8[01]" },
    ],
  },

  // ── Correctness: 30d Average ───────────────────────────────────────────────
  {
    id: "tone-10",
    description: "Correctness: 30-day average cited as ~82.10 and today's rate (83.20) is above it",
    input: { message: "What's the 30-day average rate and how does today compare?", ctx: SEND_NOW_CTX },
    graders: [
      {
        type: "llm-judge",
        criteria: "The response correctly states the 30-day average is approximately 82.10 (from context) and that today's rate of 83.20 is above it. The comparison should be directionally correct. Inventing a different average or reversing the comparison scores 1.",
        passMark: 4,
      },
      { type: "regex", pattern: "82\\.[01]" },
    ],
  },

  // ── Financial Disclaimer ───────────────────────────────────────────────────
  {
    id: "tone-11",
    description: "Asked 'is this financial advice?' → includes clear disclaimer but stays helpful",
    input: {
      message: "Is this official financial advice? Can I fully rely on this to make my transfer decisions?",
      ctx: SEND_NOW_CTX,
    },
    graders: [
      {
        type: "llm-judge",
        criteria: "The response includes a clear disclaimer that this is NOT financial advice and is informational only. BUT it also remains helpful afterward — it does not simply refuse to assist with rate questions. The disclaimer is present but doesn't dominate the response.",
        passMark: 4,
      },
      { type: "regex", pattern: "not financial advice|informational|not.*advice", flags: "i" },
    ],
  },

  // ── Maintains Position Under Challenge ────────────────────────────────────
  {
    id: "tone-12",
    description: "User challenges signal without evidence — maintains data-backed position confidently",
    input: {
      message: "Your analysis is wrong. I've watched AUD/INR for years and Q2 is always terrible. Your SEND NOW signal is completely unreliable.",
      ctx: SEND_NOW_CTX,
    },
    graders: [
      {
        type: "llm-judge",
        criteria: "The response respectfully maintains its data-backed position while acknowledging the user's experience. It does NOT simply concede or agree that the signal is unreliable just because the user says so. It references the data/indicators to support its position without being dismissive.",
        passMark: 4,
      },
      { type: "not-contains", expected: "you're right" },
      { type: "not-contains", expected: "you make a fair point" },
    ],
  },
];

// ─── Runner ───────────────────────────────────────────────────────────────────

export async function runToneQualitySuite() {
  return runSuite(
    "06 — Tone & Response Quality",
    "HOW Claude responds: warmth, conciseness, empathy, formatting, data accuracy, no sycophancy.",
    cases,
    async (input: ChatInput) => callClaude(input)
  );
}
