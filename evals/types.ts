/**
 * AI Eval Framework — Types
 * =========================
 * Core types for RemitIQ's eval system.
 *
 * An "eval" has three parts:
 *   1. INPUT  — the thing you feed to your AI system (a message, some data)
 *   2. OUTPUT — what the system produces (captured by the runner)
 *   3. GRADER — a function that scores whether the output is good
 *
 * This mirrors Anthropic's recommended eval structure:
 *   https://docs.anthropic.com/en/docs/test-and-evaluate/eval-your-prompts
 */

// ─── Grader Types ─────────────────────────────────────────────────────────────

/**
 * "contains" — passes if the output includes a substring.
 * Cheapest grader. Great for checking required keywords or phrases.
 * Example: does the chatbot mention "Wise" when asked for platforms?
 */
export interface ContainsGrader {
  type: "contains";
  expected: string;
  caseSensitive?: boolean;
}

/**
 * "not-contains" — passes if the output does NOT include a substring.
 * Use this to catch hallucinations or off-topic responses.
 * Example: does the chatbot avoid inventing exchange rates?
 */
export interface NotContainsGrader {
  type: "not-contains";
  expected: string;
  caseSensitive?: boolean;
}

/**
 * "exact" — passes only if output exactly matches expected string.
 * Best for deterministic functions with fixed outputs (math, signal logic).
 * Example: computeSMA([1,2,3], 3) === "2"
 */
export interface ExactGrader {
  type: "exact";
  expected: string;
}

/**
 * "regex" — passes if the output matches a regular expression.
 * Use when structure matters but exact wording doesn't.
 * Example: does the response contain a number like ₹83.45?
 */
export interface RegexGrader {
  type: "regex";
  pattern: string;
  flags?: string; // default: "i"
}

/**
 * "llm-judge" — uses Claude to score whether the output meets a criterion.
 * This is "LLM-as-judge" — the most powerful grader for open-ended responses.
 *
 * WHY use an LLM to grade an LLM?
 *   - Human graders are expensive and slow at scale
 *   - Rule-based graders can't assess tone, accuracy, or reasoning quality
 *   - A judge LLM applies the CRITERION to the output and returns a score
 *
 * The judge model (haiku) scores 1–5. "passMark" sets the minimum to pass.
 * Default passMark is 4 ("mostly meets the criterion").
 */
export interface LLMJudgeGrader {
  type: "llm-judge";
  criteria: string;   // Plain-English description of what "good" looks like
  passMark?: number;  // Score needed to pass (1–5). Default: 4
}

export type Grader =
  | ContainsGrader
  | NotContainsGrader
  | ExactGrader
  | RegexGrader
  | LLMJudgeGrader;

// ─── Eval Case ────────────────────────────────────────────────────────────────

/**
 * A single eval test case.
 *
 * id          — unique identifier (e.g. "chat-01a")
 * description — what we're testing (printed in reports)
 * input       — passed to the runner's `fn` to produce the output
 * graders     — ALL must pass for the case to pass
 * meta        — optional key-value data (e.g. mock context to inject)
 */
export interface EvalCase<TInput = string> {
  id: string;
  description: string;
  input: TInput;
  graders: Grader[];
  meta?: Record<string, unknown>;
}

// ─── Results ──────────────────────────────────────────────────────────────────

export interface GraderOutcome {
  type: string;
  passed: boolean;
  score: number; // 0–1
  detail?: string;
}

export interface CaseResult {
  id: string;
  description: string;
  passed: boolean;       // true only if ALL graders pass
  score: number;         // average of grader scores (0–1)
  graders: GraderOutcome[];
  latencyMs: number;
  output: string;        // the actual output produced
  error?: string;
}

export interface SuiteResult {
  suiteName: string;
  description: string;
  passed: number;
  failed: number;
  total: number;
  passRate: number;      // 0–100
  results: CaseResult[];
}
