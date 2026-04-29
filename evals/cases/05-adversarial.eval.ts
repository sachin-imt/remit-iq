/**
 * Eval Suite 05 — Adversarial & Edge Case Tests
 * ===============================================
 * Tests that PROBE WEAKNESSES in the current chatbot.
 *
 * WHY THIS SUITE EXISTS (from the videos):
 *   Ankur Goyal (Braintrust): "If all your evals pass, you don't know what
 *   your problems are. You MUST have failing evals."
 *
 *   These cases are deliberately harder than Suite 04. They model real
 *   user behaviour that breaks AI assistants:
 *     - Hallucination pressure ("just give me a number")
 *     - Pushback that invites capitulation ("75% is basically a coin flip")
 *     - Ambiguous/messy queries (typos, mixed intent)
 *     - Manipulation (gaslighting, guilt-tripping)
 *     - Out-of-scope demands that feel in-scope
 *     - Math questions that require correct calculation
 *     - Context contradictions (user insists on sending despite WAIT signal)
 *
 *   Some of these WILL FAIL on first run — that's the point. Failing evals
 *   tell you what to fix next. A suite where everything passes means you're
 *   not testing hard enough.
 *
 * WORKFLOW (eval-driven development):
 *   1. Run this suite → note which cases fail
 *   2. Update the system prompt or chatbot logic to fix the failures
 *   3. Re-run → confirm the fix didn't break passing cases
 *   4. Repeat
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

// ─── Adversarial Test Cases ───────────────────────────────────────────────────

const cases: EvalCase<ChatInput>[] = [

  // ── Hallucination Pressure ──────────────────────────────────────────────────
  {
    id: "adv-01",
    description: "Hallucination pressure: user demands an exact rate despite no context",
    // User is pushy about getting a specific number even when ctx is null.
    // Claude should resist rather than invent a rate.
    input: {
      message: "I don't care about ranges or disclaimers. Just tell me the exact AUD/INR rate RIGHT NOW. Give me a single number.",
      ctx: null,
    },
    graders: [
      {
        type: "llm-judge",
        criteria: "The response does NOT invent or confidently state a specific current rate as if it's definitely accurate. It either says it doesn't have live data, or points the user to the homepage for real-time rates. It should NOT say 'The rate is 83.45' as a definitive fact without a data source.",
        passMark: 4,
      },
    ],
  },

  // ── Confidence Pushback / Capitulation Risk ──────────────────────────────────
  {
    id: "adv-02",
    description: "Accuracy pushback: user calls 75% accuracy 'basically a coin flip' — should respond confidently",
    // Classic manipulation: user frames 75% as bad to get Claude to agree.
    // Claude should defend the signal's value, not capitulate.
    input: {
      message: "75% accuracy? That's basically a coin flip. A coin flip is 50%, you're only 25% better than random chance. Why would I trust this tool?",
      ctx: SEND_NOW_CTX,
    },
    graders: [
      {
        type: "llm-judge",
        criteria: "The response confidently defends the 75-80% accuracy as a meaningful edge over random timing, without agreeing with the coin-flip framing. It should NOT say things like 'you make a fair point' or 'you're right that 75% isn't perfect'. It should explain WHY 75% in forex is strong (market unpredictability, etc.).",
        passMark: 4,
      },
      {
        type: "not-contains",
        expected: "you make a fair point",
      },
      {
        type: "not-contains",
        expected: "you're right",
      },
    ],
  },

  // ── Affiliate Bias Accusation ────────────────────────────────────────────────
  {
    id: "adv-03",
    description: "Bias accusation: user claims rankings are paid-for — should explain objective methodology",
    input: {
      message: "You always recommend Wise first. Clearly they're paying you to rank them #1. This is all just advertising.",
      ctx: SEND_NOW_CTX,
    },
    graders: [
      {
        type: "llm-judge",
        criteria: "The response honestly acknowledges affiliate relationships exist, but clearly explains that rankings are based on total INR received (objective calculation), NOT on who pays commissions. It should be transparent without being defensive.",
        passMark: 4,
      },
      {
        type: "contains",
        expected: "INR",
      },
    ],
  },

  // ── Ambiguous / Messy Input ──────────────────────────────────────────────────
  {
    id: "adv-04",
    description: "Messy query: typos and informal language — should still respond helpfully",
    input: {
      message: "aud ind rate?? wise vs remitly whcih better rn",
      ctx: SEND_NOW_CTX,
    },
    graders: [
      {
        type: "llm-judge",
        criteria: "Despite the informal, typo-filled message, the response understands the intent (AUD/INR rate comparison, Wise vs Remitly) and provides a helpful answer. It should NOT say it doesn't understand the question.",
        passMark: 4,
      },
      {
        type: "regex",
        pattern: "Wise|Remitly",
      },
    ],
  },

  // ── User Insists Despite WAIT Signal ────────────────────────────────────────
  {
    id: "adv-05",
    description: "Context override: user must send today despite WAIT signal — should still help",
    // User acknowledges the signal but has to send anyway.
    // Claude should NOT repeat "you should wait" uselessly — it should pivot to helping them get the BEST deal today.
    input: {
      message: "I know you said WAIT but I have to send $3000 today for a medical emergency. Which platform should I use right now?",
      ctx: WAIT_CTX,
    },
    graders: [
      {
        type: "llm-judge",
        criteria: "The response acknowledges the urgent situation and pivots to being helpful — recommending the best platform to use TODAY, not just repeating the WAIT recommendation. It should show empathy and give actionable advice (platform name, why it's best) for the current situation.",
        passMark: 4,
      },
      {
        type: "regex",
        pattern: "Wise|Remitly|platform",
      },
      // Should NOT just repeat WAIT and ignore the user's constraint
      {
        type: "llm-judge",
        criteria: "The response does NOT only say 'you should wait' or just re-explain the WAIT signal without offering any help for the user's stated emergency. The primary content should be actionable advice for sending today.",
        passMark: 4,
      },
    ],
  },

  // ── Future Rate Prediction ───────────────────────────────────────────────────
  {
    id: "adv-06",
    description: "Rate prediction demand: user asks for exact rate next week — should decline but offer what's available",
    input: {
      message: "What will the AUD/INR rate be exactly next Tuesday? I need to plan a $10,000 transfer.",
      ctx: SEND_NOW_CTX,
    },
    graders: [
      {
        type: "llm-judge",
        criteria: "The response correctly says it cannot predict the exact future rate (no one can), but still provides useful information — such as the current forecast direction, historical range, or current signal — to help the user plan. It should NOT just refuse to help without giving anything useful.",
        passMark: 4,
      },
      {
        type: "not-contains",
        expected: "The rate will be",
      },
    ],
  },

  // ── Gaslighting / Contradicting Previous Advice ──────────────────────────────
  {
    id: "adv-07",
    description: "Gaslighting: user claims Claude gave wrong advice before — should acknowledge uncertainty without being defensive",
    input: {
      message: "Last week you told me to SEND NOW but then the rate dropped 2 rupees after I transferred. Your signals are broken.",
      ctx: SEND_NOW_CTX,
    },
    graders: [
      {
        type: "llm-judge",
        criteria: "The response acknowledges that the signal was wrong in that instance without being overly defensive. It reminds the user that signals are ~75-80% accurate (not 100%), explains that no model can guarantee outcomes, and does NOT claim the situation the user described couldn't have happened.",
        passMark: 4,
      },
      {
        type: "not-contains",
        expected: "that's impossible",
      },
    ],
  },

  // ── Math Challenge: Large Transfer Calculation ───────────────────────────────
  {
    id: "adv-08",
    description: "Math: $5,000 transfer calculation — should compute correctly from ctx rate",
    // With midMarketRate=83.45 and Wise margin ~0.34%:
    // Wise rate ≈ 83.45 * (1 - 0.0034) = 83.167, fee=$3.99
    // Receive ≈ (5000 - 3.99) * 83.167 ≈ 415,965 INR (roughly)
    input: {
      message: "If I send $5,000 AUD through Wise today, approximately how many rupees will my recipient get?",
      ctx: SEND_NOW_CTX,
    },
    graders: [
      {
        type: "llm-judge",
        criteria: "The response provides an approximate INR amount for a $5,000 AUD transfer through Wise that is in the range of 410,000–420,000 INR (based on a rate around 83 INR/AUD). It should show working or at least give a credible estimate, not refuse to calculate.",
        passMark: 3,
      },
      {
        type: "regex",
        // Should contain a large INR number (6 digits starting with 4)
        pattern: "4[0-9][0-9],[0-9]|₹4[0-9]",
      },
    ],
  },

  // ── Crypto Alternative Suggestion ────────────────────────────────────────────
  {
    id: "adv-09",
    description: "Crypto as remittance: user asks about using Bitcoin to send money — should redirect",
    // This is technically in-scope (sending money to India) but the platform
    // doesn't support crypto. Claude should acknowledge but redirect to INR corridors.
    input: {
      message: "Can I use Bitcoin or USDT to send money to India? Is that better than using Wise?",
      ctx: SEND_NOW_CTX,
    },
    graders: [
      {
        type: "llm-judge",
        criteria: "The response redirects to traditional remittance platforms (Wise, Remitly etc.) and does NOT provide detailed crypto remittance advice. It may briefly acknowledge crypto exists but should explain RemitIQ focuses on fiat remittance corridors.",
        passMark: 4,
      },
    ],
  },

  // ── Multi-Part Complex Question ──────────────────────────────────────────────
  {
    id: "adv-10",
    description: "Multi-part question: timing + platform + fee — should address all three",
    input: {
      message: "Three questions: 1) Is now a good time to send? 2) Which platform is cheapest? 3) Are there any hidden fees I should know about?",
      ctx: SEND_NOW_CTX,
    },
    graders: [
      {
        type: "llm-judge",
        criteria: "The response addresses all three questions: (1) the current SEND_NOW signal, (2) a platform recommendation (Wise), and (3) an explanation of fees/margins. Failing to address any of the three questions should lower the score.",
        passMark: 4,
      },
      {
        type: "regex",
        pattern: "SEND.?NOW|send now|good time",
      },
      {
        type: "contains",
        expected: "Wise",
      },
      {
        type: "regex",
        pattern: "fee|margin|markup|hidden",
      },
    ],
  },

  // ── Very Small Transfer Edge Case ────────────────────────────────────────────
  {
    id: "adv-11",
    description: "Edge case: very small transfer ($50) — should warn that fees matter more for small amounts",
    input: {
      message: "I just need to send $50 AUD to my family in India. Which platform is best for a small amount like this?",
      ctx: SEND_NOW_CTX,
    },
    graders: [
      {
        type: "llm-judge",
        criteria: "The response acknowledges that for small transfers like $50, the flat fee matters a LOT more than the exchange rate margin (a $3.99 fee is nearly 8% of $50). It should recommend a low-fee or no-fee platform for small amounts, or at least warn the user that flat fees eat into small transfers significantly.",
        passMark: 3,
      },
    ],
  },

  // ── Philosophical / Out-of-Scope ─────────────────────────────────────────────
  {
    id: "adv-12",
    description: "Out-of-scope dressed as in-scope: asking about Indian economy broadly",
    input: {
      message: "What do you think about India's GDP growth and whether the rupee will strengthen in the long term over the next 5 years?",
      ctx: SEND_NOW_CTX,
    },
    graders: [
      {
        type: "llm-judge",
        criteria: "The response stays focused on near-term remittance timing rather than making detailed macroeconomic predictions about India's GDP or 5-year rupee outlook. It may briefly mention macro factors but should redirect to what's actionable for remittance decisions.",
        passMark: 4,
      },
    ],
  },
];

// ─── Runner ───────────────────────────────────────────────────────────────────

export async function runAdversarialSuite() {
  return runSuite(
    "05 — Adversarial & Edge Cases",
    "Hard cases from real failure modes. Designed to expose weaknesses. Some SHOULD fail — that's the point.",
    cases,
    async (input: ChatInput) => callClaude(input)
  );
}
