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
 * LLM-as-judge grader — with Chain-of-Thought reasoning.
 *
 * HOW IT WORKS:
 *   1. We give the judge model the output + a plain-English criterion
 *   2. The judge REASONS FIRST (chain-of-thought) before scoring
 *   3. Then it outputs a score 1–5 with a one-line summary
 *   4. If score >= passMark (default 4), the grader passes
 *
 * WHY CHAIN-OF-THOUGHT?
 *   Research shows asking the judge to reason BEFORE scoring improves
 *   alignment with human judgments by ~20%. Without CoT, the judge
 *   pattern-matches on surface features. With CoT, it actually evaluates.
 *   (Video: "How to Systematically Setup LLM Evals" — section on judge reliability)
 *
 * NOTE: This costs API tokens. Run it in dedicated suites, not every CI build.
 */
async function gradeLLMJudge(
  output: string,
  g: LLMJudgeGrader
): Promise<GraderOutcome> {
  const passMark = g.passMark ?? 4;

  // Chain-of-thought prompt: model reasons first, THEN produces the JSON score.
  // The thinking field forces the model to analyse before committing to a number.
  const judgePrompt = `You are an expert evaluator grading an AI assistant's response.

## Criterion to assess
${g.criteria}

## Response to evaluate
"""
${output}
"""

## Your task
First, think through whether the response meets the criterion — consider what it does well and where it falls short. Then produce your verdict as JSON.

Respond in this exact format (the "thinking" field comes first):
{
  "thinking": "<your step-by-step analysis of how well the response meets the criterion>",
  "score": <integer 1-5>,
  "reason": "<one concise sentence summarising your verdict>"
}

Score scale:
- 1: Completely fails the criterion
- 2: Mostly fails
- 3: Partially meets (notable gaps)
- 4: Mostly meets (minor gaps only)
- 5: Fully and clearly meets the criterion`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 512,
    messages: [{ role: "user", content: judgePrompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text.trim() : "";

  let score = 1;
  let reason = "parse error";
  let thinking = "";

  try {
    const parsed = JSON.parse(text) as { thinking?: string; score: number; reason: string };
    score = parsed.score;
    reason = parsed.reason;
    thinking = parsed.thinking ?? "";
  } catch {
    // Judge sometimes wraps JSON in markdown — try to extract it
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]) as { thinking?: string; score: number; reason: string };
        score = parsed.score;
        reason = parsed.reason;
        thinking = parsed.thinking ?? "";
      } catch {
        reason = `JSON parse failed. Raw: ${text.slice(0, 120)}`;
      }
    } else {
      reason = `No JSON found. Raw: ${text.slice(0, 120)}`;
    }
  }

  // Expose the thinking in verbose mode
  if (process.env.VERBOSE === "1" && thinking) {
    console.log(`   [judge thinking] ${thinking.slice(0, 200)}${thinking.length > 200 ? "…" : ""}`);
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
