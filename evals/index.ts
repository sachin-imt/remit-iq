/**
 * RemitIQ AI Eval Runner
 * =======================
 * Runs all evaluation suites and prints a comprehensive report.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT ARE AI EVALS?
 *
 * An "eval" (short for evaluation) is a structured test that measures how well
 * an AI system performs on a specific task. Think of it like a test suite for
 * your AI — similar to unit tests in software, but for model behaviour.
 *
 * Unlike traditional tests that check if code returns the right value, evals
 * check things like:
 *   - Does the chatbot mention the right signal? (contains grader)
 *   - Does it stay on-topic? (not-contains grader)
 *   - Is the response helpful and well-reasoned? (llm-judge grader)
 *
 * WHY THEY MATTER:
 *   Every time you change a system prompt, update business logic, or swap a
 *   model, your evals tell you whether the change made things better or worse.
 *   Without evals, you're flying blind — you "feel" like it improved, but you
 *   have no data.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * REMITIQ EVAL STRUCTURE:
 *
 *   Suite 01 — Chat Intent Matching
 *     Tests matchIntent() — the rule-based pattern matcher.
 *     Free. Instant. Run on every commit.
 *
 *   Suite 02 — System Prompt Quality
 *     Tests buildSystemPrompt() — verifies live data injection.
 *     Free. Instant. Run on every commit.
 *
 *   Suite 03 — Technical Indicator Math (03a–03f)
 *     Tests computeRSI, computeSMA, etc. — the signal math engine.
 *     Free. Instant. Run on every commit.
 *
 *   Suite 04 — Claude Chat Quality (LLM-as-Judge)
 *     Tests real Claude API responses using haiku as judge.
 *     Costs ~$0.003/case. Run before releases or after major changes.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * USAGE:
 *
 *   # Run all suites (includes LLM suite)
 *   npx tsx evals/index.ts
 *
 *   # Run only cheap suites (no API calls)
 *   npx tsx evals/index.ts --cheap
 *
 *   # Run with verbose output (show all outputs, not just failures)
 *   VERBOSE=1 npx tsx evals/index.ts
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * GRADER TYPES (cheapest → most powerful):
 *
 *   "exact"       — output must exactly match a string
 *   "contains"    — output must include a substring
 *   "not-contains"— output must NOT include a substring
 *   "regex"       — output must match a regular expression
 *   "llm-judge"   — a judge LLM scores the output on a criterion (1–5)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { runChatIntentSuite } from "./cases/01-chat-intent.eval";
import { runSystemPromptSuite } from "./cases/02-system-prompt.eval";
import { runIndicatorsSuite } from "./cases/03-indicators.eval";
import { runChatLLMSuite } from "./cases/04-chat-llm.eval";
import { printSummary } from "./runner";
import type { SuiteResult } from "./types";

const CHEAP_ONLY = process.argv.includes("--cheap");

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║           RemitIQ AI Eval Runner                               ║
║           Testing: Chat · Prompts · Indicators · Claude        ║
╚════════════════════════════════════════════════════════════════╝`);

  if (CHEAP_ONLY) {
    console.log("\n   Mode: --cheap (skipping Suite 04 — Claude API calls)\n");
  } else {
    console.log("\n   Mode: full (includes Suite 04 — Claude API calls)\n");
    console.log("   Tip: run with --cheap to skip Suite 04 and save API costs.\n");
  }

  const allResults: SuiteResult[] = [];

  // ── Suite 01: Chat Intent Matching (free, deterministic) ──────────────────
  const intentResult = await runChatIntentSuite();
  allResults.push(intentResult);

  // ── Suite 02: System Prompt Quality (free, deterministic) ─────────────────
  const promptResult = await runSystemPromptSuite();
  allResults.push(promptResult);

  // ── Suite 03: Technical Indicator Math (free, deterministic) ──────────────
  const indicatorResults = await runIndicatorsSuite();
  allResults.push(...indicatorResults);

  // ── Suite 04: Claude Chat Quality (costs money, uses LLM judge) ───────────
  if (!CHEAP_ONLY) {
    const llmResult = await runChatLLMSuite();
    allResults.push(llmResult);
  }

  // ── Final Summary ─────────────────────────────────────────────────────────
  printSummary(allResults);

  // Exit with error code if any suite has failures (for CI use)
  const anyFailed = allResults.some((s) => s.failed > 0);
  process.exit(anyFailed ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error running evals:", err);
  process.exit(1);
});
