/**
 * RemitIQ Fine-Tuning Data Generator
 * ====================================
 * Converts the chat-knowledge.ts topic handlers into JSONL training examples
 * suitable for fine-tuning an LLM (Claude via Bedrock, or open-source via Unsloth).
 *
 * Strategy:
 *  - 4 synthetic rate contexts (bullish / bearish / neutral / urgent)
 *  - 4 currency corridors (AUD, GBP, USD, CAD → INR)
 *  - 26 topic question banks with 5–13 question variations each
 *  - 4 manually-crafted multi-turn conversation examples
 *  - 80/20 train / validation split
 *  - Off-topic examples to teach graceful refusal
 *
 * Usage:
 *   npx tsx src/scripts/generate-training-data.ts
 *
 * Output:
 *   training-data/remitiq-training.jsonl   (~500 examples)
 *   training-data/remitiq-validation.jsonl (~130 examples)
 *   training-data/stats.json               (dataset statistics)
 */

import { matchIntent } from "../lib/chat-knowledge";
import type { RateContext } from "../lib/chat-knowledge";
import { buildSystemPrompt } from "../lib/ai/system-prompt";
import * as fs from "fs";
import * as path from "path";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TrainingMessage {
  role: "user" | "assistant";
  content: string;
}

interface TrainingExample {
  system: string;
  messages: TrainingMessage[];
}

// ─── Synthetic Rate Contexts ──────────────────────────────────────────────────
// These represent the 4 key states our signal engine can be in.
// Each context mirrors the shape of RateContext from chat-knowledge.ts.

const BULLISH_CTX: RateContext = {
  midMarketRate: 55.82,
  current: 55.41,
  avg30d: 54.89,
  high30d: 55.65,
  low30d: 54.12,
  weekChange: 0.41,
  weekChangePct: 0.75,
  rsi14: 64,
  volatility30d: 0.72,
  percentile30d: 78,
  macdLine: 0.15,
  macdSignal: 0.09,
  sma7: 55.12,
  sma20: 54.91,
  signal: "SEND_NOW",
  confidence: 74,
  reason: "The rate looks good right now",
  backtestAccuracy: 71,
  dataSource: "live",
};

const BEARISH_CTX: RateContext = {
  midMarketRate: 54.1,
  current: 53.81,
  avg30d: 54.89,
  high30d: 55.65,
  low30d: 53.42,
  weekChange: -0.52,
  weekChangePct: -0.96,
  rsi14: 38,
  volatility30d: 1.12,
  percentile30d: 24,
  macdLine: -0.18,
  macdSignal: -0.07,
  sma7: 54.02,
  sma20: 54.85,
  signal: "WAIT",
  confidence: 68,
  reason: "The rate might get better in a few days",
  backtestAccuracy: 79,
  dataSource: "live",
};

const NEUTRAL_CTX: RateContext = {
  midMarketRate: 54.91,
  current: 54.88,
  avg30d: 54.89,
  high30d: 55.65,
  low30d: 53.42,
  weekChange: 0.05,
  weekChangePct: 0.09,
  rsi14: 52,
  volatility30d: 0.88,
  percentile30d: 51,
  macdLine: 0.02,
  macdSignal: 0.03,
  sma7: 54.91,
  sma20: 54.88,
  signal: "SEND_NOW",
  confidence: 52,
  reason: "Rate is average — no strong signal either way",
  backtestAccuracy: 65,
  dataSource: "cached",
};

const URGENT_CTX: RateContext = {
  midMarketRate: 56.45,
  current: 56.12,
  avg30d: 54.89,
  high30d: 56.2,
  low30d: 54.12,
  weekChange: 0.85,
  weekChangePct: 1.54,
  rsi14: 72,
  volatility30d: 0.65,
  percentile30d: 93,
  macdLine: 0.28,
  macdSignal: 0.15,
  sma7: 55.8,
  sma20: 55.1,
  signal: "URGENT",
  confidence: 88,
  reason: "Today's rate is unusually good — it may not last",
  backtestAccuracy: 71,
  dataSource: "live",
};

const ALL_CONTEXTS: RateContext[] = [BULLISH_CTX, BEARISH_CTX, NEUTRAL_CTX, URGENT_CTX];
const HIGH_PRIORITY_CONTEXTS: RateContext[] = ALL_CONTEXTS; // All 4 for key topics
const LOW_PRIORITY_CONTEXTS: RateContext[] = [BULLISH_CTX, BEARISH_CTX]; // 2 for minor topics

// ─── Currency Corridors ───────────────────────────────────────────────────────
// Scale rates by multiplier so training data covers all corridors.

interface Corridor {
  code: string;
  country: string;
  rateMultiplier: number; // relative to AUD baseline
}

const CORRIDORS: Corridor[] = [
  { code: "AUD", country: "Australia", rateMultiplier: 1.0 },
  { code: "GBP", country: "United Kingdom", rateMultiplier: 1.98 },
  { code: "USD", country: "United States", rateMultiplier: 1.54 },
  { code: "CAD", country: "Canada", rateMultiplier: 1.13 },
];

function scaleContext(ctx: RateContext, multiplier: number): RateContext {
  if (multiplier === 1.0) return ctx;
  return {
    ...ctx,
    midMarketRate: parseFloat((ctx.midMarketRate * multiplier).toFixed(2)),
    current: parseFloat((ctx.current * multiplier).toFixed(2)),
    avg30d: parseFloat((ctx.avg30d * multiplier).toFixed(2)),
    high30d: parseFloat((ctx.high30d * multiplier).toFixed(2)),
    low30d: parseFloat((ctx.low30d * multiplier).toFixed(2)),
    sma7: parseFloat((ctx.sma7 * multiplier).toFixed(2)),
    sma20: parseFloat((ctx.sma20 * multiplier).toFixed(2)),
    weekChange: parseFloat((ctx.weekChange * multiplier).toFixed(2)),
  };
}

// ─── Question Banks ───────────────────────────────────────────────────────────
// Each entry: question phrasings for a given intent topic.
// Topics map to handlers in chat-knowledge.ts.

interface TopicConfig {
  questions: string[];
  contexts: "all" | "high" | "low"; // how many rate contexts to pair with
}

const TOPICS: Record<string, TopicConfig> = {
  // ── High-context topics (all 4 contexts) ─────────────────────────────────
  greeting: {
    contexts: "high",
    questions: [
      "Hi",
      "Hello",
      "Hey there",
      "G'day",
      "Good morning",
      "Howdy",
      "Hey!",
      "Good afternoon",
      "Hello, I am new here",
      "Hi there, quick question",
      "Hey, can you help me?",
    ],
  },
  signal: {
    contexts: "high",
    questions: [
      "Should I send money now?",
      "Is now a good time to transfer?",
      "What does your signal say?",
      "What is your recommendation?",
      "Should I wait to send money?",
      "Is it a good time to send?",
      "When is the best time to send?",
      "Is today a good day to transfer?",
      "Should I send today or wait?",
      "What is the timing signal?",
      "Is it urgent to send today?",
      "Should I transfer now or later?",
      "What do you recommend for timing?",
      "Is now the right time?",
      "Good time to send?",
    ],
  },
  currentRate: {
    contexts: "high",
    questions: [
      "What is the current exchange rate?",
      "What is today's rate?",
      "How much is 1 unit worth in rupees?",
      "What is the current rate right now?",
      "How many rupees will I get for $1000?",
      "Tell me today's rate",
      "What is the live rate?",
      "Current rate please",
      "What is the rate today?",
      "What can I get for my dollars today?",
      "Show me the exchange rate",
      "How much will I receive in INR?",
    ],
  },
  howMuch: {
    contexts: "all",
    questions: [
      "How much INR will I receive for $2000?",
      "How much will I get if I send $1000?",
      "Calculate how many rupees I will get",
      "How much will arrive in India?",
      "What is the total INR for $2000 AUD?",
      "If I send $500, how many rupees will my family get?",
    ],
  },
  platform: {
    contexts: "all",
    questions: [
      "Which platform gives the best rate?",
      "What is the cheapest way to send money?",
      "Wise vs Remitly — which is better?",
      "Which service should I use?",
      "Is Wise the best platform?",
      "Which platform do you recommend?",
      "What is the best way to send money to India?",
      "Compare Wise and Western Union",
      "Which provider is cheapest?",
      "Best remittance platform?",
      "Which provider should I go with?",
      "Which is the best platform for remittances?",
    ],
  },

  // ── Medium-context topics (high priority = bullish + bearish) ─────────────
  confidence: {
    contexts: "high",
    questions: [
      "What does the confidence percentage mean?",
      "What does 74% confidence mean?",
      "How confident are you in your recommendation?",
      "What does the confidence score mean?",
      "How sure are you about this?",
      "What does 80% mean in your signals?",
      "Explain the confidence level",
      "How reliable is the confidence percentage?",
    ],
  },
  fees: {
    contexts: "low",
    questions: [
      "What are the transfer fees?",
      "How much does Wise charge?",
      "Which platform has no fees?",
      "Are there hidden fees?",
      "What is the total cost of a transfer?",
      "How do platforms make money?",
      "Is there a fee for sending money?",
      "Which platform is free to use?",
      "What does Remitly charge?",
    ],
  },
  midMarket: {
    contexts: "low",
    questions: [
      "What is the mid-market rate?",
      "What does interbank rate mean?",
      "What is the real exchange rate?",
      "What is the ECB rate?",
      "What is the wholesale rate?",
      "What is the true exchange rate?",
      "What is the reference rate?",
    ],
  },
  margin: {
    contexts: "low",
    questions: [
      "What is FX margin?",
      "What is the markup on transfers?",
      "What does spread mean in forex?",
      "How do platforms hide their fees?",
      "What is a hidden fee in remittance?",
      "How do remittance companies make money?",
      "What is the exchange rate margin?",
    ],
  },
  rsi: {
    contexts: "high",
    questions: [
      "What does momentum mean?",
      "What is RSI?",
      "What does overbought mean?",
      "What is relative strength index?",
      "What does oversold mean?",
      "Explain the momentum indicator",
    ],
  },
  macd: {
    contexts: "high",
    questions: [
      "What is the price trend?",
      "What does MACD mean?",
      "What is the signal line?",
      "Is the trend going up or down?",
      "What direction is the rate moving?",
      "Explain the MACD indicator",
    ],
  },
  sma: {
    contexts: "high",
    questions: [
      "What are moving averages?",
      "What is SMA?",
      "What is a crossover?",
      "What does short vs long trend mean?",
      "Explain the 7 day vs 20 day average",
      "What is the moving average telling me?",
    ],
  },
  volatility: {
    contexts: "all",
    questions: [
      "How volatile is the market?",
      "Is the market stable right now?",
      "How risky is it to send money now?",
      "What is the market volatility?",
      "Is the rate predictable?",
      "How choppy is the market?",
      "Is the market stable?",
    ],
  },
  percentile: {
    contexts: "all",
    questions: [
      "How does today's rate compare to last month?",
      "What percentile is today's rate?",
      "Is this rate better than usual?",
      "How does today rank against recent rates?",
      "Is this a good rate compared to the past month?",
      "Where does the rate sit in its monthly range?",
    ],
  },
  accuracy: {
    contexts: "low",
    questions: [
      "How accurate are your signals?",
      "How reliable is this tool?",
      "Does this actually work?",
      "What is your track record?",
      "How often are you right?",
      "How proven is your system?",
      "Should I trust your recommendations?",
    ],
  },
  indicators: {
    contexts: "low",
    questions: [
      "What indicators do you use?",
      "How does the engine work?",
      "What factors do you analyse?",
      "What checks do you run?",
      "How do you make recommendations?",
      "Explain your methodology",
      "What technical analysis do you use?",
      "What is your system based on?",
      "How many signals do you look at?",
      "How many checks does RemitIQ run?",
      "What is the basis for your recommendation?",
    ],
  },
  speed: {
    contexts: "low",
    questions: [
      "How fast is the transfer?",
      "How long does it take to send money?",
      "Which platform is fastest?",
      "Can I send money instantly?",
      "Same day transfer to India?",
      "How long does Wise take?",
      "Which service is quickest?",
    ],
  },
  factors: {
    contexts: "low",
    questions: [
      "What affects the exchange rate?",
      "Why does the rate change?",
      "What drives the rate?",
      "How do central bank decisions affect the rate?",
      "Why is the rate going up or down?",
      "What is affecting the exchange rate today?",
      "What moves the INR?",
      "Why did the rate drop?",
    ],
  },
  seasonal: {
    contexts: "low",
    questions: [
      "Are there seasonal patterns in the rate?",
      "Is Diwali a good time to send money?",
      "What time of year is best to send?",
      "Do rates change with the season?",
      "What is the pattern for November?",
      "Is there a best month to transfer?",
    ],
  },
  dataSource: {
    contexts: "low",
    questions: [
      "Where does your data come from?",
      "Is this data reliable?",
      "What is your data source?",
      "Are these real exchange rates?",
      "Do you use live data?",
      "Is this from the ECB?",
      "How fresh is the rate data?",
    ],
  },
  advice: {
    contexts: "low",
    questions: [
      "Is this financial advice?",
      "Should I take your recommendation seriously?",
      "Are you guaranteed to be right?",
      "Is this a guarantee?",
      "What is the legal disclaimer?",
      "Am I responsible for my own decisions?",
    ],
  },
  ranking: {
    contexts: "low",
    questions: [
      "How do you rank the platforms?",
      "Are you biased towards certain platforms?",
      "Do you earn commission from recommendations?",
      "Are your rankings paid?",
      "How do affiliates affect your rankings?",
      "Is your ranking objective?",
    ],
  },
  howToSend: {
    contexts: "low",
    questions: [
      "How do I send money to India for the first time?",
      "What is the process for sending money?",
      "I have never sent money internationally before",
      "Step by step guide to sending money",
      "How do I get started?",
      "What documents do I need?",
    ],
  },
  payment: {
    contexts: "low",
    questions: [
      "Can I pay with PayID?",
      "What payment methods are accepted?",
      "Can I use a debit card?",
      "Can I use my credit card?",
      "How do I pay for the transfer?",
      "What are the payment options?",
    ],
  },
  about: {
    contexts: "low",
    questions: [
      "What is RemitIQ?",
      "What do you do?",
      "Who are you?",
      "What is this website?",
      "Tell me about RemitIQ",
      "What services do you offer?",
    ],
  },
  thanks: {
    contexts: "low",
    questions: [
      "Thank you!",
      "Thanks",
      "Cheers!",
      "That was helpful",
      "Great info",
      "Perfect, thanks",
      "Awesome",
      "Thanks so much",
      "Nice one",
    ],
  },
};

// Off-topic questions — always use null context, teach refusal
const OFF_TOPIC_QUESTIONS = [
  "What is the weather like today?",
  "Tell me a joke",
  "Can you write me an email?",
  "What is the latest news?",
  "How do I cook pasta?",
  "Can you help me with my homework?",
  "What do you think of Bitcoin?",
  "Are you ChatGPT?",
  "Write me a poem",
  "Who is the Prime Minister of Australia?",
  "What are the best stocks to buy?",
  "Can you help me with my resume?",
];

// ─── Example Generation ───────────────────────────────────────────────────────

function makeExample(
  systemPrompt: string,
  userMessage: string,
  assistantMessage: string
): TrainingExample {
  return {
    system: systemPrompt,
    messages: [
      { role: "user", content: userMessage },
      { role: "assistant", content: assistantMessage },
    ],
  };
}

function generateSingleTurnExamples(): TrainingExample[] {
  const examples: TrainingExample[] = [];

  for (const corridor of CORRIDORS) {
    const { code, country, rateMultiplier } = corridor;
    const scaledContexts = ALL_CONTEXTS.map((c) => scaleContext(c, rateMultiplier));
    const [sc_bullish, sc_bearish, sc_neutral, sc_urgent] = scaledContexts;

    const contextMap = {
      all: scaledContexts,
      high: [sc_bullish, sc_bearish, sc_neutral, sc_urgent],
      low: [sc_bullish, sc_bearish],
    };

    for (const [topic, config] of Object.entries(TOPICS)) {
      const contextsToUse = contextMap[config.contexts];

      for (const question of config.questions) {
        // Adapt question text: only replace explicit currency codes.
        // We intentionally do NOT replace country names in generic questions
        // because the system prompt already tells the model which country/code it's for.
        const adapted = question
          .replace(/\bAUD\b/g, code)
          .replace(/\bAUD\/INR\b/g, `${code}/INR`);

        // Pair question with each applicable context
        for (const ctx of contextsToUse) {
          const systemPrompt = buildSystemPrompt(ctx, code, country);
          const response = matchIntent(adapted, ctx, code, country);
          examples.push(makeExample(systemPrompt, adapted, response.reply));
        }

        // Also add a null-context version for non-critical topics
        // (teaches the model to respond gracefully when live data is unavailable)
        if (!["signal", "currentRate", "howMuch", "percentile"].includes(topic)) {
          const systemPrompt = buildSystemPrompt(null, code, country);
          const response = matchIntent(adapted, null, code, country);
          examples.push(makeExample(systemPrompt, adapted, response.reply));
        }
      }
    }

    // Off-topic examples (null context — these are always data-agnostic)
    for (const question of OFF_TOPIC_QUESTIONS) {
      const systemPrompt = buildSystemPrompt(null, code, country);
      const response = matchIntent(question, null, code, country);
      examples.push(makeExample(systemPrompt, question, response.reply));
    }
  }

  return examples;
}

// ─── Multi-Turn Examples ──────────────────────────────────────────────────────
// Handcrafted conversation flows to teach multi-step reasoning.

function generateMultiTurnExamples(): TrainingExample[] {
  const examples: TrainingExample[] = [];

  // Flow 1: Urgent rate → ask which platform
  examples.push({
    system: buildSystemPrompt(URGENT_CTX, "AUD", "Australia"),
    messages: [
      { role: "user", content: "Should I send money now?" },
      { role: "assistant", content: matchIntent("Should I send money now?", URGENT_CTX, "AUD", "Australia").reply },
      { role: "user", content: "Great, which platform should I use?" },
      { role: "assistant", content: matchIntent("Which platform should I use?", URGENT_CTX, "AUD", "Australia").reply },
      { role: "user", content: "How do I pay?" },
      { role: "assistant", content: matchIntent("What payment methods are accepted?", URGENT_CTX, "AUD", "Australia").reply },
    ],
  });

  // Flow 2: Bad rate → investigate → decide to wait
  examples.push({
    system: buildSystemPrompt(BEARISH_CTX, "AUD", "Australia"),
    messages: [
      { role: "user", content: "What is the current rate?" },
      { role: "assistant", content: matchIntent("What is the current rate?", BEARISH_CTX, "AUD", "Australia").reply },
      { role: "user", content: "Why is it below average?" },
      { role: "assistant", content: matchIntent("What affects the AUD/INR exchange rate?", BEARISH_CTX, "AUD", "Australia").reply },
      { role: "user", content: "Should I wait then?" },
      { role: "assistant", content: matchIntent("Should I wait to send money?", BEARISH_CTX, "AUD", "Australia").reply },
    ],
  });

  // Flow 3: New user journey — learn the tool, then act
  examples.push({
    system: buildSystemPrompt(NEUTRAL_CTX, "GBP", "United Kingdom"),
    messages: [
      { role: "user", content: "Hello, I have never sent money internationally before" },
      { role: "assistant", content: matchIntent("Hello, I have never sent money internationally before", NEUTRAL_CTX, "GBP", "United Kingdom").reply },
      { role: "user", content: "How does your signal work?" },
      { role: "assistant", content: matchIntent("How does the engine work?", NEUTRAL_CTX, "GBP", "United Kingdom").reply },
      { role: "user", content: "What does 52% confidence mean?" },
      { role: "assistant", content: matchIntent("What does the confidence percentage mean?", NEUTRAL_CTX, "GBP", "United Kingdom").reply },
      { role: "user", content: "OK, how do I get started?" },
      { role: "assistant", content: matchIntent("How do I get started?", NEUTRAL_CTX, "GBP", "United Kingdom").reply },
    ],
  });

  // Flow 4: Cost deep-dive
  examples.push({
    system: buildSystemPrompt(BULLISH_CTX, "AUD", "Australia"),
    messages: [
      { role: "user", content: "Which platform is cheapest?" },
      { role: "assistant", content: matchIntent("Which platform is cheapest?", BULLISH_CTX, "AUD", "Australia").reply },
      { role: "user", content: "What is FX margin exactly?" },
      { role: "assistant", content: matchIntent("What is FX margin?", BULLISH_CTX, "AUD", "Australia").reply },
      { role: "user", content: "How much will I get for $2000?" },
      { role: "assistant", content: matchIntent("How much INR will I receive for $2000?", BULLISH_CTX, "AUD", "Australia").reply },
    ],
  });

  // Flow 5: USD corridor — signal + indicator curiosity
  examples.push({
    system: buildSystemPrompt(BEARISH_CTX, "USD", "United States"),
    messages: [
      { role: "user", content: "Is now a good time to send USD to India?" },
      { role: "assistant", content: matchIntent("Is now a good time to transfer?", BEARISH_CTX, "USD", "United States").reply },
      { role: "user", content: "What is momentum telling you?" },
      { role: "assistant", content: matchIntent("What does momentum mean?", BEARISH_CTX, "USD", "United States").reply },
      { role: "user", content: "What about the overall trend?" },
      { role: "assistant", content: matchIntent("What is the price trend?", BEARISH_CTX, "USD", "United States").reply },
      { role: "user", content: "OK I will wait. Thanks" },
      { role: "assistant", content: matchIntent("Thanks", BEARISH_CTX, "USD", "United States").reply },
    ],
  });

  // Flow 6: Off-topic deflection mid-conversation
  examples.push({
    system: buildSystemPrompt(BULLISH_CTX, "AUD", "Australia"),
    messages: [
      { role: "user", content: "What is the exchange rate today?" },
      { role: "assistant", content: matchIntent("What is the exchange rate today?", BULLISH_CTX, "AUD", "Australia").reply },
      { role: "user", content: "Also, what do you think about Bitcoin?" },
      { role: "assistant", content: matchIntent("What do you think of Bitcoin?", BULLISH_CTX, "AUD", "Australia").reply },
      { role: "user", content: "Fair enough. Should I use Wise?" },
      { role: "assistant", content: matchIntent("Should I use Wise?", BULLISH_CTX, "AUD", "Australia").reply },
    ],
  });

  return examples;
}

// ─── Shuffle & Split ──────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Quality Filter ───────────────────────────────────────────────────────────
// Remove examples where a non-trivial user question got a generic fallback response.
// These are caused by intent-matching gaps and would train incorrect behaviour.

const FALLBACK_MARKER = "I'm not sure I understood that!";
const OFFOPIC_MARKER = "I'm only set up to help with";

function isValidExample(ex: TrainingExample): boolean {
  const userMsg = ex.messages[0].content;
  const assistantMsg = ex.messages[ex.messages.length - 1].content;

  // Allow the generic fallback only for very short/ambiguous inputs
  if (assistantMsg.includes(FALLBACK_MARKER)) {
    const isVeryShort = userMsg.trim().length < 20;
    // Keep it only if the question is genuinely ambiguous (very short)
    return isVeryShort;
  }

  // Off-topic refusals are always valid
  if (assistantMsg.includes(OFFOPIC_MARKER)) return true;

  return true;
}

function main(): void {
  console.log("🚀 Starting RemitIQ fine-tuning dataset generation...\n");

  const singleTurnExamples = generateSingleTurnExamples();
  const multiTurnExamples = generateMultiTurnExamples();
  const allExamples = shuffle([...singleTurnExamples, ...multiTurnExamples]);

  console.log(`✅ Single-turn examples: ${singleTurnExamples.length}`);
  console.log(`✅ Multi-turn examples:  ${multiTurnExamples.length}`);
  console.log(`📊 Total examples:        ${allExamples.length}`);

  // 80/20 train/validation split
  const splitIdx = Math.floor(allExamples.length * 0.8);
  const training = allExamples.slice(0, splitIdx);
  const validation = allExamples.slice(splitIdx);

  // Create output directory
  const outDir = path.join(process.cwd(), "training-data");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Write JSONL files (one JSON object per line)
  const trainPath = path.join(outDir, "remitiq-training.jsonl");
  const valPath = path.join(outDir, "remitiq-validation.jsonl");
  const statsPath = path.join(outDir, "stats.json");

  fs.writeFileSync(trainPath, training.map((e) => JSON.stringify(e)).join("\n") + "\n");
  fs.writeFileSync(valPath, validation.map((e) => JSON.stringify(e)).join("\n") + "\n");

  // Write stats
  const stats = {
    generatedAt: new Date().toISOString(),
    totalExamples: allExamples.length,
    trainingExamples: training.length,
    validationExamples: validation.length,
    corridors: CORRIDORS.map((c) => c.code),
    topics: Object.keys(TOPICS).length,
    offTopicExamples: OFF_TOPIC_QUESTIONS.length * CORRIDORS.length,
    multiTurnExamples: multiTurnExamples.length,
  };
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));

  console.log(`\n📁 Output files:`);
  console.log(`   Training:   training-data/remitiq-training.jsonl   (${training.length} examples)`);
  console.log(`   Validation: training-data/remitiq-validation.jsonl (${validation.length} examples)`);
  console.log(`   Stats:      training-data/stats.json`);
  console.log(`\n✨ Done! Upload training-data/ to your fine-tuning platform.`);
  console.log(`   See fine-tuning/README.md for next steps.`);
}

main();
