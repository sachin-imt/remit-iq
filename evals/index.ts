/**
 * RemitIQ AI Eval Runner
 * =======================
 * Runs all evaluation suites and prints a comprehensive report.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT ARE AI EVALS?
 *
 * An "eval" (short for evaluation) is a structured test that measures how well
 * an AI system performs on a specific task.
 *
 * Every eval has three parts (Data-Task-Scores framework from Braintrust):
 *   DATA  → EvalCase.input  — what you feed to the system
 *   TASK  → the `fn` passed to runSuite — calls Claude, runs logic, etc.
 *   SCORE → EvalCase.graders — measures whether the output is good
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SUITE OVERVIEW:
 *
 *   Suite 01 — Chat Intent Matching        (30 cases)  Free, instant
 *   Suite 02 — System Prompt Quality       (15 cases)  Free, instant
 *   Suite 03 — Technical Indicator Math    (24 cases)  Free, instant
 *   Suite 04 — Claude Chat Quality         (17 cases)  ~$0.05, LLM judge
 *   Suite 05 — Adversarial & Edge Cases    (12 cases)  ~$0.04, LLM judge
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * USAGE:
 *
 *   npm run evals:cheap            # Suites 01-03 only (free, use in CI)
 *   npm run evals                  # All suites including LLM calls
 *   npm run evals -- --compare     # Show diff vs previous run
 *   VERBOSE=1 npm run evals:cheap  # Show all outputs, not just failures
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * RESULT PERSISTENCE:
 *
 *   Every run saves to evals/results/TIMESTAMP.json
 *   The latest run is always at evals/results/latest.json
 *   The previous run is at evals/results/previous.json
 *   Use --compare to see what changed between runs.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { runChatIntentSuite } from "./cases/01-chat-intent.eval";
import { runSystemPromptSuite } from "./cases/02-system-prompt.eval";
import { runIndicatorsSuite } from "./cases/03-indicators.eval";
import { runChatLLMSuite } from "./cases/04-chat-llm.eval";
import { runAdversarialSuite } from "./cases/05-adversarial.eval";
import { printSummary, saveResults, printDiff } from "./runner";
import type { SuiteResult } from "./types";

const CHEAP_ONLY = process.argv.includes("--cheap");
const COMPARE = process.argv.includes("--compare");

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║           RemitIQ AI Eval Runner                               ║
║           Testing: Chat · Prompts · Indicators · Claude        ║
╚════════════════════════════════════════════════════════════════╝`);

  if (CHEAP_ONLY) {
    console.log("\n   Mode: --cheap (skipping Suites 04 & 05 — Claude API calls)\n");
  } else {
    console.log("\n   Mode: full (includes Suites 04 & 05 — Claude API calls)\n");
    console.log("   Tip: --cheap skips LLM suites. --compare diffs against previous run.\n");
  }

  const allResults: SuiteResult[] = [];

  // ── Suite 01: Chat Intent Matching (free, deterministic) ──────────────────
  allResults.push(await runChatIntentSuite());

  // ── Suite 02: System Prompt Quality (free, deterministic) ─────────────────
  allResults.push(await runSystemPromptSuite());

  // ── Suite 03: Technical Indicator Math (free, deterministic) ──────────────
  allResults.push(...await runIndicatorsSuite());

  if (!CHEAP_ONLY) {
    // ── Suite 04: Claude Chat Quality (LLM-as-judge) ────────────────────────
    allResults.push(await runChatLLMSuite());

    // ── Suite 05: Adversarial & Edge Cases (LLM-as-judge) ───────────────────
    allResults.push(await runAdversarialSuite());
  }

  // ── Summary & Persistence ─────────────────────────────────────────────────
  printSummary(allResults);
  saveResults(allResults);
  if (COMPARE) printDiff();

  const anyFailed = allResults.some((s) => s.failed > 0);
  process.exit(anyFailed ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error running evals:", err);
  process.exit(1);
});
