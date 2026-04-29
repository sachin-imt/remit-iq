/**
 * evals/export-excel.ts
 * =====================
 * Exports all eval cases + latest run results to a two-tab Excel file.
 *
 * Tab 1 "Eval Cases"  — every test case: suite, ID, description, input, graders
 * Tab 2 "Results"     — cheap suites run fresh; LLM suites pulled from latest.json
 *
 * Usage:
 *   npm run export:excel
 *
 * Output:
 *   evals/remitiq-evals.xlsx
 */

import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

// ── Case imports ──────────────────────────────────────────────────────────────
import { cases as intentCases } from "./cases/01-chat-intent.eval";
import { cases as promptCases } from "./cases/02-system-prompt.eval";
import {
  smaCases, emaCases, rsiCases,
  percentileCases, volatilityCases, intelligenceCases,
} from "./cases/03-indicators.eval";
import { cases as llmCases } from "./cases/04-chat-llm.eval";
import { cases as adversarialCases } from "./cases/05-adversarial.eval";

// ── Suite runners (cheap only) ────────────────────────────────────────────────
import { runChatIntentSuite } from "./cases/01-chat-intent.eval";
import { runSystemPromptSuite } from "./cases/02-system-prompt.eval";
import { runIndicatorsSuite } from "./cases/03-indicators.eval";

import type { EvalCase, Grader, CaseResult, SuiteResult } from "./types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Render any case input as a short readable string for the spreadsheet. */
function serializeInput(input: unknown): string {
  if (typeof input === "string") return input;
  if (typeof input !== "object" || input === null) return String(input);

  const obj = input as Record<string, unknown>;

  // Chat suites (04, 05) — ChatInput { message, ctx, currency, country }
  if ("message" in obj) return String(obj.message);

  // System-prompt suite (02) — { ctx, currency, country }
  if ("currency" in obj && "country" in obj) {
    const hasCtx = obj.ctx !== null && obj.ctx !== undefined;
    return `${obj.currency} / ${obj.country} — ctx: ${hasCtx ? "live data" : "null"}`;
  }

  // Indicator suites — data array inputs
  if ("data" in obj && "period" in obj) {
    const arr = obj.data as number[];
    const preview = arr.slice(0, 4).join(", ") + (arr.length > 4 ? ` … (${arr.length} values)` : "");
    return `data=[${preview}], period=${obj.period}`;
  }
  if ("current" in obj && "data" in obj) {
    const arr = obj.data as number[];
    return `current=${obj.current}, data[${arr.length} values]`;
  }
  if ("rates" in obj) {
    const arr = obj.rates as number[];
    return `rates[${arr.length} values, ${arr[0]}→${arr[arr.length - 1]}]`;
  }

  return JSON.stringify(input).slice(0, 120);
}

/** Render a grader as a single readable line. */
function serializeGrader(g: Grader): string {
  switch (g.type) {
    case "exact":        return `exact: "${g.expected}"`;
    case "contains":     return `contains: "${g.expected}"`;
    case "not-contains": return `not-contains: "${g.expected}"`;
    case "regex":        return `regex: /${g.pattern}/${g.flags ?? "i"}`;
    case "llm-judge": {
      const mark = g.passMark ?? 4;
      const criteria = g.criteria.length > 100
        ? g.criteria.slice(0, 97) + "…"
        : g.criteria;
      return `llm-judge (pass ≥ ${mark}/5): ${criteria}`;
    }
  }
}

/** Collect all cases tagged with their suite name. */
interface TaggedCase {
  suite: string;
  evalCase: EvalCase<unknown>;
}

function collectAllCases(): TaggedCase[] {
  const groups: [string, EvalCase<unknown>[]][] = [
    ["01 — Chat Intent",          intentCases as EvalCase<unknown>[]],
    ["02 — System Prompt",        promptCases as EvalCase<unknown>[]],
    ["03a — computeSMA",          smaCases    as EvalCase<unknown>[]],
    ["03b — computeEMA",          emaCases    as EvalCase<unknown>[]],
    ["03c — computeRSI",          rsiCases    as EvalCase<unknown>[]],
    ["03d — computePercentile",   percentileCases as EvalCase<unknown>[]],
    ["03e — computeVolatility",   volatilityCases as EvalCase<unknown>[]],
    ["03f — Intelligence E2E",    intelligenceCases as EvalCase<unknown>[]],
    ["04 — Claude Chat (LLM)",    llmCases    as EvalCase<unknown>[]],
    ["05 — Adversarial",          adversarialCases as EvalCase<unknown>[]],
  ];

  return groups.flatMap(([suite, cases]) =>
    cases.map((c) => ({ suite, evalCase: c }))
  );
}

// ─── Tab 1: Eval Cases ────────────────────────────────────────────────────────

function buildCasesSheet(tagged: TaggedCase[]): XLSX.WorkSheet {
  // Header
  const rows: unknown[][] = [[
    "Suite", "Case ID", "Description", "Input", "# Graders", "Grader 1", "Grader 2", "Grader 3", "Grader 4",
  ]];

  for (const { suite, evalCase: c } of tagged) {
    const graderCells = Array.from({ length: 4 }, (_, i) =>
      c.graders[i] ? serializeGrader(c.graders[i]) : ""
    );
    rows.push([
      suite,
      c.id,
      c.description,
      serializeInput(c.input),
      c.graders.length,
      ...graderCells,
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Column widths
  ws["!cols"] = [
    { wch: 28 }, // Suite
    { wch: 16 }, // Case ID
    { wch: 55 }, // Description
    { wch: 55 }, // Input
    { wch: 10 }, // # Graders
    { wch: 70 }, // Grader 1
    { wch: 70 }, // Grader 2
    { wch: 70 }, // Grader 3
    { wch: 70 }, // Grader 4
  ];

  return ws;
}

// ─── Tab 2: Results ───────────────────────────────────────────────────────────

/** Result lookup keyed by case ID — merged from live run + latest.json. */
type ResultMap = Map<string, { suite: string; result: CaseResult | null; fromJson: boolean }>;

/**
 * Loads LLM suite results from latest.json (if available).
 * Returns a map of caseId → partial result (no output, just passed/score).
 */
function loadLLMResultsFromJson(): Map<string, { passed: boolean; score: number }> {
  const jsonPath = path.join(__dirname, "results", "latest.json");
  if (!fs.existsSync(jsonPath)) return new Map();

  try {
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf8")) as {
      suites: Array<{ name: string; cases: Array<{ id: string; passed: boolean; score: number }> }>;
    };
    const map = new Map<string, { passed: boolean; score: number }>();
    for (const suite of data.suites) {
      // Only include LLM suites (04, 05) from JSON — cheap suites are re-run live
      if (suite.name.startsWith("04") || suite.name.startsWith("05")) {
        for (const c of suite.cases) map.set(c.id, { passed: c.passed, score: c.score });
      }
    }
    return map;
  } catch {
    return new Map();
  }
}

function buildResultsSheet(
  tagged: TaggedCase[],
  liveResults: SuiteResult[],
  jsonResults: Map<string, { passed: boolean; score: number }>
): XLSX.WorkSheet {
  // Build a lookup from liveResults (cheap suites)
  const liveMap = new Map<string, CaseResult>();
  for (const suite of liveResults) {
    for (const r of suite.results) liveMap.set(r.id, r);
  }

  // Header
  const rows: unknown[][] = [[
    "Suite", "Case ID", "Description", "Status", "Score %",
    "Latency (ms)", "Output Preview", "Grader Details",
  ]];

  for (const { suite, evalCase: c } of tagged) {
    const live = liveMap.get(c.id);
    const fromJson = jsonResults.get(c.id);

    let status: string;
    let scorePct: string;
    let latency: string;
    let outputPreview: string;
    let graderDetails: string;

    if (live) {
      status = live.passed ? "✅ PASS" : "❌ FAIL";
      scorePct = (live.score * 100).toFixed(0) + "%";
      latency = String(live.latencyMs);
      outputPreview = live.output.replace(/\n/g, " ").slice(0, 200);
      graderDetails = live.graders
        .map((g) => `[${g.type}] ${g.passed ? "✓" : "✗"} ${g.detail ?? ""}`)
        .join("\n");
    } else if (fromJson) {
      status = fromJson.passed ? "✅ PASS" : "❌ FAIL";
      scorePct = (fromJson.score * 100).toFixed(0) + "%";
      latency = "—";
      outputPreview = "(from saved results — re-run npm run evals for live output)";
      graderDetails = "";
    } else {
      status = "⏸ NOT RUN";
      scorePct = "—";
      latency = "—";
      outputPreview = "Run: npm run evals";
      graderDetails = "";
    }

    rows.push([suite, c.id, c.description, status, scorePct, latency, outputPreview, graderDetails]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);

  ws["!cols"] = [
    { wch: 28 }, // Suite
    { wch: 16 }, // Case ID
    { wch: 55 }, // Description
    { wch: 12 }, // Status
    { wch: 10 }, // Score %
    { wch: 12 }, // Latency
    { wch: 70 }, // Output Preview
    { wch: 80 }, // Grader Details
  ];

  return ws;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("📊 RemitIQ Eval Excel Export");
  console.log("────────────────────────────");

  // 1. Collect all cases
  const tagged = collectAllCases();
  console.log(`   Found ${tagged.length} total eval cases across 10 suites`);

  // 2. Run cheap suites to get live results (01-03)
  console.log("\n   Running cheap suites (01–03) for live results…\n");
  const liveResults: SuiteResult[] = [
    await runChatIntentSuite(),
    await runSystemPromptSuite(),
    ...await runIndicatorsSuite(),
  ];
  const livePassed = liveResults.reduce((s, r) => s + r.passed, 0);
  const liveTotal  = liveResults.reduce((s, r) => s + r.total, 0);
  console.log(`\n   Cheap suites: ${livePassed}/${liveTotal} passed`);

  // 3. Load LLM suite results from latest.json
  const jsonResults = loadLLMResultsFromJson();
  const llmFromJson = jsonResults.size;
  console.log(`   LLM suite results loaded from latest.json: ${llmFromJson} cases`);
  if (llmFromJson === 0) {
    console.log("   Tip: run 'npm run evals' first to include Suite 04 & 05 results");
  }

  // 4. Build workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, buildCasesSheet(tagged),  "Eval Cases");
  XLSX.utils.book_append_sheet(wb, buildResultsSheet(tagged, liveResults, jsonResults), "Results");

  // 5. Write file
  const outPath = path.join(__dirname, "remitiq-evals.xlsx");
  XLSX.writeFile(wb, outPath);
  console.log(`\n✅ Saved → ${outPath}`);
  console.log(`   Tab 1: ${tagged.length} eval cases`);
  console.log(`   Tab 2: ${liveTotal} live results + ${llmFromJson} from saved JSON\n`);
}

main().catch((err) => {
  console.error("Export failed:", err);
  process.exit(1);
});
