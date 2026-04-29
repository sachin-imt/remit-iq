/**
 * AI Eval Framework — Graders
 * ============================
 * Each grader takes an output string and returns a GraderOutcome.
 *
 * Grader hierarchy (cheapest → most powerful):
 *   exact → contains → not-contains → regex → llm-judge
 *
 * Rule: use the cheapest grader that can make the call.
 * Reserve llm-judge for subjective quality assessments that rules can't catch.
 */

import Anthropic from "@anthropic-ai/sdk";
import type {
  Grader,
  GraderOutcome,
  ContainsGrader,
  NotContainsGrader,
  ExactGrader,
  RegexGrader,
  LLMJudgeGrader,
} from "./types";

// Shared Anthropic client — reused across all grader calls in a run
const anthropic = new Anthropic();

// ─── Individual Graders ───────────────────────────────────────────────────────

function gradeContains(output: string, g: ContainsGrader): GraderOutcome {
  const haystack = g.caseSensitive ? output : output.toLowerCase();
  const needle = g.caseSensitive ? g.expected : g.expected.toLowerCase();
  const passed = haystack.includes(needle);
  return {
    type: "contains",
    passed,
    score: passed ? 1 : 0,
    detail: `Looking for "${g.expected}"`,
  };
}

function gradeNotContains(output: string, g: NotContainsGrader): GraderOutcome {
  const haystack = g.caseSensitive ? output : output.toLowerCase();
  const needle = g.caseSensitive ? g.expected : g.expected.toLowerCase();
  const passed = !haystack.includes(needle);
  return {
    type: "not-contains",
    passed,
    score: passed ? 1 : 0,
    detail: `Should NOT contain "${g.expected}"`,
  };
}

function gradeExact(output: string, g: ExactGrader): GraderOutcome {
  const passed = output.trim() === g.expected.trim();
  return {
    type: "exact",
    passed,
    score: passed ? 1 : 0,
    detail: `Expected exactly: "${g.expected}"`,
  };
}

function gradeRegex(output: string, g: RegexGrader): GraderOutcome {
  const re = new RegExp(g.pattern, g.flags ?? "i");
  const passed = re.test(output);
  return {
    type: "regex",
    passed,
    score: passed ? 1 : 0,
    detail: `Pattern /${g.pattern}/${g.flags ?? "i"}`,
  };
}

/**
 * LLM-as-judge grader.
 *
 * HOW IT WORKS:
 *   1. We give the judge model the output + a plain-English criterion
 *   2. The judge scores 1–5 and provides a one-sentence reason
 *   3. If score >= passMark (default 4), the grader passes
 *
 * WHY THIS MATTERS:
 *   Rules can't tell you if a response is helpful, accurate, or well-reasoned.
 *   A judge LLM can — it reads the response the way a human would.
 *
 * NOTE: This costs API tokens. Run it in a dedicated "expensive eval" suite,
 *       not in every CI build. Cheap graders should run every time.
 */
async function gradeLLMJudge(
  output: string,
  g: LLMJudgeGrader
): Promise<GraderOutcome> {
  const passMark = g.passMark ?? 4;

  const judgePrompt = `You are an expert evaluator grading an AI assistant's response.

## Criterion to assess
${g.criteria}

## Response to evaluate
"""
${output}
"""

## Scoring
Rate how well the response meets the criterion on a 1–5 scale:
- 1: Completely fails (criterion is ignored or contradicted)
- 2: Mostly fails (criterion barely addressed)
- 3: Partially meets (criterion met but with significant gaps)
- 4: Mostly meets (criterion well-addressed with minor gaps)
- 5: Fully meets (criterion clearly and completely satisfied)

Respond ONLY with valid JSON in this exact format — no other text:
{"score": <integer 1-5>, "reason": "<one concise sentence explaining your score>"}`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 256,
    messages: [{ role: "user", content: judgePrompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text.trim() : "";

  let score = 1;
  let reason = "parse error";

  try {
    const parsed = JSON.parse(text) as { score: number; reason: string };
    score = parsed.score;
    reason = parsed.reason;
  } catch {
    reason = `JSON parse failed. Raw: ${text.slice(0, 100)}`;
  }

  const passed = score >= passMark;
  return {
    type: "llm-judge",
    passed,
    score: score / 5,
    detail: `${score}/5 — ${reason}`,
  };
}

// ─── Main Grade Dispatcher ────────────────────────────────────────────────────

export async function grade(
  output: string,
  grader: Grader
): Promise<GraderOutcome> {
  switch (grader.type) {
    case "contains":
      return gradeContains(output, grader);
    case "not-contains":
      return gradeNotContains(output, grader);
    case "exact":
      return gradeExact(output, grader);
    case "regex":
      return gradeRegex(output, grader);
    case "llm-judge":
      return gradeLLMJudge(output, grader);
  }
}
