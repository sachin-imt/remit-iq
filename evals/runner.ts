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
 * The runner doesn't care what fn does internally — it only sees the string
 * output. This makes it easy to swap implementations without changing evals.
 */

import type { EvalCase, CaseResult, SuiteResult } from "./types";
import { grade } from "./graders";

const VERBOSE = process.env.VERBOSE === "1";

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

    // Grade all graders (LLM judges run async but sequentially to avoid rate limits)
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

  // Always show grader details for failed cases; show in verbose mode for passed
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
      `${icon} ${suite.suiteName.padEnd(30)} ${bar} ${suite.passed}/${suite.total}`
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

function makeProgressBar(pct: number, width = 20): string {
  const filled = Math.round((pct / 100) * width);
  return "[" + "█".repeat(filled) + "░".repeat(width - filled) + "]";
}
