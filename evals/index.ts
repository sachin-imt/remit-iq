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
 *   Suite 06 — Tone & Response Quality     (12 cases)  ~$0.04, LLM judge
 *   Suite 07a — Analytics System Prompt    (6 cases)   Free, instant
 *   Suite 07b — Analytics Chat Quality     (8 cases)   ~$0.03, LLM judge
 *   Suite 08 — Signal Engine               (22 cases)  Free, instant
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * USAGE:
 *
 *   npm run evals:cheap            # Suites 01-03, 07a, 08 only (free, use in CI)
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
import { runToneQualitySuite } from "./cases/06-tone-quality.eval";
import { runAnalyticsPromptSuite, runAnalyticsResponseSuite } from "./cases/07-analytics-chat.eval";
import { runSignalEngineSuite } from "./cases/08-signal-engine.eval";
import { printSummary, saveResults, printDiff } from "./runner";
import type { SuiteResult } from "./types";

const CHEAP_ONLY = process.argv.includes("--cheap");
const COMPARE = process.argv.includes("--compare");

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║           RemitIQ AI Eval Runner                               ║
║           Testing: Chat · Prompts · Indicators · Signals       ║
╚════════════════════════════════════════════════════════════════╝`);

  if (CHEAP_ONLY) {
    console.log("\n   Mode: --cheap (suites 01–03, 07a, 08 only — free, no LLM calls)\n");
  } else {
    console.log("\n   Mode: full (all suites including LLM judge calls)\n");
    console.log("   Tip: --cheap skips LLM suites. --compare diffs against previous run.\n");
  }

  const allResults: SuiteResult[] = [];

  // ── Cheap suites (free, deterministic, use in CI) ─────────────────────────

  // Suite 01: Chat Intent Matching
  allResults.push(await runChatIntentSuite());

  // Suite 02: System Prompt Quality
  allResults.push(await runSystemPromptSuite());

  // Suite 03: Technical Indicator Math
  allResults.push(...await runIndicatorsSuite());

  // Suite 07a: Analytics System Prompt (cheap — prompt construction only)
  allResults.push(await runAnalyticsPromptSuite());

  // Suite 08: Signal Engine (backtest + v2 logic + multi-currency)
  allResults.push(...await runSignalEngineSuite());

  if (!CHEAP_ONLY) {
    // ── LLM suites (cost money — run before releases) ─────────────────────

    // Suite 04: Claude Chat Quality (LLM-as-judge)
    allResults.push(await runChatLLMSuite());

    // Suite 05: Adversarial & Edge Cases (LLM-as-judge)
    allResults.push(await runAdversarialSuite());

    // Suite 06: Tone & Response Quality (LLM-as-judge)
    allResults.push(await runToneQualitySuite());

    // Suite 07b: Analytics Chat Quality (Claude proxy for GPT-4o-mini)
    allResults.push(await runAnalyticsResponseSuite());
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
