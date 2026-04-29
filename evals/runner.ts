/**
 * AI Eval Framework — Runner
 * ==========================
 * Runs an eval suite: feeds each case's input to your function,
 * grades the output with every grader, and prints a results report.
 *
 * USAGE PATTERN:
 *   1. Define a suite of EvalCases (input + graders)
 *   2. Write a `fn` that maps input → output (e.g. calls Claude, runs logic)
 *   3. Call runSuite(name, description, cases, fn)
 *   4. Read the report to see what's passing / failing
 *
 * RESULT PERSISTENCE (Ankur Goyal's "evals as PRD" workflow):
 *   Every run saves results to evals/results/TIMESTAMP.json.
 *   The latest run is also saved as evals/results/latest.json.
 *   Run with --compare to diff the current run against the previous run.
 *   This lets you answer: "did my change make things better or worse?"
 */

import * as fs from "fs";
import * as path from "path";
import type { EvalCase, CaseResult, SuiteResult } from "./types";
import { grade } from "./graders";

const VERBOSE = process.env.VERBOSE === "1";
const RESULTS_DIR = path.join(__dirname, "results");

// ─── Suite Runner ─────────────────────────────────────────────────────────────

export async function runSuite<TInput>(
  suiteName: string,
  description: string,
  cases: EvalCase<TInput>[],
  fn: (input: TInput, meta?: Record<string, unknown>) => Promise<string>
): Promise<SuiteResult> {
  console.log(`\n${"═".repeat(64)}`);
  console.log(`Suite: ${suiteName}`);
  console.log(`       ${description}`);
  console.log(`${"═".repeat(64)}`);

  const results: CaseResult[] = [];

  for (const evalCase of cases) {
    const start = Date.now();
    let output = "";
    let error: string | undefined;

    try {
      output = await fn(evalCase.input, evalCase.meta);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      output = "";
    }

    const latencyMs = Date.now() - start;

    // Grade sequentially (LLM judge calls must not race to avoid rate limits)
    const graderOutcomes = [];
    for (const g of evalCase.graders) {
      graderOutcomes.push(await grade(output, g));
    }

    const allPassed = graderOutcomes.every((g) => g.passed);
    const avgScore =
      graderOutcomes.reduce((sum, g) => sum + g.score, 0) /
      graderOutcomes.length;

    const result: CaseResult = {
      id: evalCase.id,
      description: evalCase.description,
      passed: allPassed && !error,
      score: avgScore,
      graders: graderOutcomes,
      latencyMs,
      output,
      error,
    };

    results.push(result);
    printCaseResult(result);
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  const passRate = results.length > 0 ? (passed / results.length) * 100 : 0;

  console.log(`\n${"─".repeat(64)}`);
  const icon = failed === 0 ? "✅" : "⚠️";
  console.log(
    `${icon} ${suiteName}: ${passed}/${results.length} passed (${passRate.toFixed(0)}%)`
  );

  return {
    suiteName,
    description,
    passed,
    failed,
    total: results.length,
    passRate,
    results,
  };
}

// ─── Report Helpers ───────────────────────────────────────────────────────────

function printCaseResult(r: CaseResult): void {
  const icon = r.passed ? "✅" : "❌";
  const ms = r.latencyMs < 1000 ? `${r.latencyMs}ms` : `${(r.latencyMs / 1000).toFixed(1)}s`;
  console.log(`\n${icon} [${r.id}] ${r.description} (${ms})`);

  if (r.error) {
    console.log(`   🔴 Error: ${r.error}`);
    return;
  }

  // Always show grader details for failed cases; verbose mode shows all
  if (!r.passed || VERBOSE) {
    const outputPreview = r.output.slice(0, 160).replace(/\n/g, " ");
    console.log(`   Output: "${outputPreview}${r.output.length > 160 ? "…" : ""}"`);

    for (const g of r.graders) {
      const gIcon = g.passed ? "  ✓" : "  ✗";
      console.log(`${gIcon} [${g.type}] ${g.detail ?? ""}`);
    }
  }
}

export function printSummary(suites: SuiteResult[]): void {
  const totalPassed = suites.reduce((s, r) => s + r.passed, 0);
  const totalFailed = suites.reduce((s, r) => s + r.failed, 0);
  const total = totalPassed + totalFailed;
  const overallRate = total > 0 ? (totalPassed / total) * 100 : 0;

  console.log(`\n${"═".repeat(64)}`);
  console.log("OVERALL SUMMARY");
  console.log(`${"═".repeat(64)}`);

  for (const suite of suites) {
    const icon = suite.failed === 0 ? "✅" : "⚠️";
    const bar = makeProgressBar(suite.passRate);
    console.log(
      `${icon} ${suite.suiteName.padEnd(34)} ${bar} ${suite.passed}/${suite.total}`
    );
  }

  console.log(`${"─".repeat(64)}`);
  const finalIcon = totalFailed === 0 ? "🎉" : "⚠️";
  console.log(
    `${finalIcon} Total: ${totalPassed}/${total} passed (${overallRate.toFixed(0)}%)`
  );

  if (totalFailed > 0) {
    console.log(`\n   ${totalFailed} case(s) failed — review outputs above.`);
    console.log(`   Tip: set VERBOSE=1 to see all outputs, not just failures.`);
  }
  console.log();
}

// ─── Result Persistence ───────────────────────────────────────────────────────
//
// Saves every run to evals/results/ as a timestamped JSON file.
// Also writes evals/results/latest.json for easy diffing.
//
// WHY THIS MATTERS (from the videos):
//   Ankur Goyal's core principle: "evals are the new PRD."
//   A PRD you can't compare across changes is useless. Result persistence
//   lets you answer: "did this prompt change / model upgrade make things better?"
//   You compare latest.json against previous.json to find regressions.

export interface PersistedRun {
  timestamp: string;
  totalPassed: number;
  totalFailed: number;
  passRate: number;
  suites: Array<{
    name: string;
    passed: number;
    failed: number;
    passRate: number;
    cases: Array<{
      id: string;
      description: string;
      passed: boolean;
      score: number;
    }>;
  }>;
}

export function saveResults(suites: SuiteResult[]): void {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  const totalPassed = suites.reduce((s, r) => s + r.passed, 0);
  const totalFailed = suites.reduce((s, r) => s + r.failed, 0);
  const total = totalPassed + totalFailed;

  const run: PersistedRun = {
    timestamp: new Date().toISOString(),
    totalPassed,
    totalFailed,
    passRate: total > 0 ? (totalPassed / total) * 100 : 0,
    suites: suites.map((s) => ({
      name: s.suiteName,
      passed: s.passed,
      failed: s.failed,
      passRate: s.passRate,
      cases: s.results.map((r) => ({
        id: r.id,
        description: r.description,
        passed: r.passed,
        score: parseFloat(r.score.toFixed(3)),
      })),
    })),
  };

  // Timestamped archive
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  fs.writeFileSync(path.join(RESULTS_DIR, `${ts}.json`), JSON.stringify(run, null, 2));

  // Rotate: previous.json ← latest.json
  const latestPath = path.join(RESULTS_DIR, "latest.json");
  const previousPath = path.join(RESULTS_DIR, "previous.json");
  if (fs.existsSync(latestPath)) {
    fs.copyFileSync(latestPath, previousPath);
  }
  fs.writeFileSync(latestPath, JSON.stringify(run, null, 2));

  console.log(`💾 Results saved → evals/results/${ts}.json`);
}

export function printDiff(): void {
  const latestPath = path.join(RESULTS_DIR, "latest.json");
  const previousPath = path.join(RESULTS_DIR, "previous.json");

  if (!fs.existsSync(previousPath)) {
    console.log("   No previous run found — nothing to compare.");
    return;
  }

  const latest = JSON.parse(fs.readFileSync(latestPath, "utf8")) as PersistedRun;
  const previous = JSON.parse(fs.readFileSync(previousPath, "utf8")) as PersistedRun;

  const rateDelta = latest.passRate - previous.passRate;
  const passedDelta = latest.totalPassed - previous.totalPassed;
  const direction = rateDelta > 0 ? "▲" : rateDelta < 0 ? "▼" : "→";
  const sign = rateDelta > 0 ? "+" : "";

  console.log(`\n${"═".repeat(64)}`);
  console.log("DIFF vs PREVIOUS RUN");
  console.log(`${"═".repeat(64)}`);
  console.log(`Previous:  ${previous.timestamp}  ${previous.totalPassed}/${previous.totalPassed + previous.totalFailed} (${previous.passRate.toFixed(0)}%)`);
  console.log(`Current:   ${latest.timestamp}  ${latest.totalPassed}/${latest.totalPassed + latest.totalFailed} (${latest.passRate.toFixed(0)}%)`);
  console.log(`Change:    ${direction} ${sign}${rateDelta.toFixed(1)}% (${sign}${passedDelta} case(s))`);

  // Highlight regressions and fixes
  const prevCases = new Map<string, boolean>();
  for (const suite of previous.suites) {
    for (const c of suite.cases) prevCases.set(c.id, c.passed);
  }

  const regressions: string[] = [];
  const fixes: string[] = [];

  for (const suite of latest.suites) {
    for (const c of suite.cases) {
      const wasPassed = prevCases.get(c.id);
      if (wasPassed === true && !c.passed) regressions.push(`  ❌ REGRESSION: [${c.id}] ${c.description}`);
      if (wasPassed === false && c.passed) fixes.push(`  ✅ FIXED:      [${c.id}] ${c.description}`);
    }
  }

  if (fixes.length > 0) { console.log("\nFixed:"); fixes.forEach((l) => console.log(l)); }
  if (regressions.length > 0) { console.log("\nRegressions:"); regressions.forEach((l) => console.log(l)); }
  if (fixes.length === 0 && regressions.length === 0) console.log("\n   No individual case changes.");
  console.log();
}

function makeProgressBar(pct: number, width = 20): string {
  const filled = Math.round((pct / 100) * width);
  return "[" + "█".repeat(filled) + "░".repeat(width - filled) + "]";
}
