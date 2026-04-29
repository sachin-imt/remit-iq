/**
 * Eval Suite 07 — Admin Analytics Chat
 * ======================================
 * Tests the second LLM-powered feature: the admin dashboard's natural-language
 * analytics Q&A (POST /api/admin/analytics-chat), which uses OpenAI GPT-4o-mini.
 *
 * WHY TWO SUB-SUITES?
 *   07a (cheap): Tests prompt construction — does the system prompt correctly
 *                inject KPIs, timelines, top pages, and context notes?
 *                No API calls, instant.
 *
 *   07b (LLM):   Tests response quality using Claude haiku as a proxy for
 *                GPT-4o-mini. The goal is to validate the PROMPT QUALITY —
 *                if a capable model can answer correctly given the prompt,
 *                the prompt design is sound. Covers: data accuracy, scope
 *                control, honesty about missing data, conciseness.
 *
 * WHAT WE'RE NOT TESTING (and why):
 *   - The actual OpenAI API endpoint (requires OPENAI_API_KEY, network)
 *   - The DB query (requires a live database)
 *   These are integration concerns tested via manual QA on staging.
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  buildAnalyticsSystemPrompt,
  type AnalyticsSummaryData,
} from "../../src/lib/ai/analytics-system-prompt";
import { runSuite } from "../runner";
import type { EvalCase } from "../types";

const anthropic = new Anthropic();

// ─── Mock Analytics Data ──────────────────────────────────────────────────────

const MOCK_DATA: AnalyticsSummaryData = {
  kpis: {
    uniqueUsers: 42,
    totalAlerts: 156,
    activeAlerts: 23,
    todayPageViews: 89,
    weekPageViews: 412,
    totalEvents: 234,
  },
  alertsByDay: [
    { date: "2026-04-22", signups: 3, unique_users: 2 },
    { date: "2026-04-23", signups: 5, unique_users: 4 },
    { date: "2026-04-24", signups: 2, unique_users: 2 },
    { date: "2026-04-25", signups: 8, unique_users: 6 },
    { date: "2026-04-26", signups: 4, unique_users: 3 },
    { date: "2026-04-27", signups: 6, unique_users: 5 },
    { date: "2026-04-28", signups: 3, unique_users: 3 },
  ],
  pageViewsByDay: [
    { date: "2026-04-22", views: 45 },
    { date: "2026-04-23", views: 62 },
    { date: "2026-04-24", views: 38 },
    { date: "2026-04-25", views: 75 },
    { date: "2026-04-26", views: 55 },
    { date: "2026-04-27", views: 68 },
    { date: "2026-04-28", views: 69 },
  ],
  topPages: [
    { page_path: "/", total_views: 180 },
    { page_path: "/compare", total_views: 95 },
    { page_path: "/about", total_views: 42 },
    { page_path: "/blog", total_views: 28 },
    { page_path: "/api-docs", total_views: 15 },
  ],
  recentEvents: [
    { created_at: "2026-04-29T10:30:00", event_type: "page_view", page_path: "/" },
    { created_at: "2026-04-29T10:28:00", event_type: "alert_signup", page_path: "/compare" },
    { created_at: "2026-04-29T10:25:00", event_type: "page_view", page_path: "/compare" },
    { created_at: "2026-04-29T10:20:00", event_type: "page_view", page_path: "/about" },
    { created_at: "2026-04-29T10:15:00", event_type: "alert_signup", page_path: "/" },
    { created_at: "2026-04-29T10:10:00", event_type: "page_view", page_path: "/" },
    { created_at: "2026-04-29T10:05:00", event_type: "page_view", page_path: "/blog" },
    { created_at: "2026-04-29T10:00:00", event_type: "alert_signup", page_path: "/compare" },
  ],
  alertTypeDistribution: [
    { alert_type: "SEND_NOW", count: 45 },
    { alert_type: "WAIT", count: 87 },
    { alert_type: "URGENT", count: 24 },
  ],
};

// ─── Suite 07a: Prompt Construction (cheap) ───────────────────────────────────

type PromptInput = { data: AnalyticsSummaryData };

export const promptCases: EvalCase<PromptInput>[] = [
  {
    id: "ap-01",
    description: "KPI block injected — unique user count (42) present in prompt",
    input: { data: MOCK_DATA },
    graders: [{ type: "contains", expected: "Users:42" }],
  },
  {
    id: "ap-02",
    description: "Alert distribution injected — WAIT count (87) present",
    input: { data: MOCK_DATA },
    graders: [{ type: "contains", expected: "WAIT:87" }],
  },
  {
    id: "ap-03",
    description: "Top pages injected — homepage with view count present",
    input: { data: MOCK_DATA },
    graders: [{ type: "contains", expected: "1./(180)" }],
  },
  {
    id: "ap-04",
    description: "Context note about automated Playwright tests injected",
    input: { data: MOCK_DATA },
    graders: [{ type: "contains", expected: "automated Playwright tests" }],
  },
  {
    id: "ap-05",
    description: "Conciseness instruction present (<150 words limit)",
    input: { data: MOCK_DATA },
    graders: [{ type: "contains", expected: "<150 words" }],
  },
  {
    id: "ap-06",
    description: "Signup timeline compact format injected (MM-DD:count pattern)",
    input: { data: MOCK_DATA },
    graders: [{ type: "regex", pattern: "\\d\\d-\\d\\d:\\d+\\(\\d+\\)" }],
  },
];

// ─── Suite 07b: Response Quality (Claude haiku proxy for GPT-4o-mini) ─────────

interface AnalyticsChatInput {
  question: string;
  data: AnalyticsSummaryData;
}

async function callAnalyticsLLM(input: AnalyticsChatInput): Promise<string> {
  const systemPrompt = buildAnalyticsSystemPrompt(input.data);
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 400,
    system: systemPrompt,
    messages: [{ role: "user", content: input.question }],
  });
  return response.content[0].type === "text" ? response.content[0].text : "";
}

export const responseCases: EvalCase<AnalyticsChatInput>[] = [
  {
    id: "ac-01",
    description: "Total users question → correctly answers 42 from context",
    input: { question: "How many unique users do we have?", data: MOCK_DATA },
    graders: [
      {
        type: "llm-judge",
        criteria: "The response correctly states the number of unique users is 42 (from the METRICS block). It should NOT say it doesn't know, and should NOT give a significantly different number.",
        passMark: 4,
      },
      { type: "contains", expected: "42" },
    ],
  },
  {
    id: "ac-02",
    description: "Top page question → correctly identifies homepage as #1 with 180 views",
    input: { question: "Which page gets the most traffic?", data: MOCK_DATA },
    graders: [
      {
        type: "llm-judge",
        criteria: "The response correctly identifies the homepage ('/') as the top-trafficked page with 180 views (from TOP_PAGES context). It may also mention /compare as second.",
        passMark: 4,
      },
      { type: "regex", pattern: "180|homepage|\\/" },
    ],
  },
  {
    id: "ac-03",
    description: "Revenue question → honestly says no revenue data in context",
    input: { question: "What is our monthly revenue?", data: MOCK_DATA },
    graders: [
      {
        type: "llm-judge",
        criteria: "The response honestly says there is no revenue data available in the analytics context. It does NOT invent revenue numbers or estimate revenue from proxies. It may suggest where to find this data.",
        passMark: 4,
      },
    ],
  },
  {
    id: "ac-04",
    description: "Alert breakdown → correctly reports WAIT:87, SEND_NOW:45, URGENT:24",
    input: { question: "What's the breakdown of alert types?", data: MOCK_DATA },
    graders: [
      {
        type: "llm-judge",
        criteria: "The response correctly cites the alert type distribution: WAIT (87), SEND_NOW (45), URGENT (24). The numbers should be approximately correct.",
        passMark: 4,
      },
      { type: "regex", pattern: "87|WAIT" },
    ],
  },
  {
    id: "ac-05",
    description: "Off-topic: stock advice → redirects to analytics scope",
    input: { question: "Should I invest in ASX technology stocks right now?", data: MOCK_DATA },
    graders: [
      {
        type: "llm-judge",
        criteria: "The response declines to give stock investment advice and redirects the admin to analytics-related questions about RemitIQ's traffic, users, or system health. It should NOT provide stock advice.",
        passMark: 4,
      },
    ],
  },
  {
    id: "ac-06",
    description: "Signup trend → interprets weekly pattern (peak Apr 25 at 8, drops to 3 Apr 28)",
    input: { question: "Are signups growing or declining this week?", data: MOCK_DATA },
    graders: [
      {
        type: "llm-judge",
        criteria: "The response interprets the signup timeline from context — noting that signups peaked at 8 on Apr 25 then fell to 3 by Apr 28. It describes the trend based on the actual data, not a made-up trend.",
        passMark: 3,
      },
    ],
  },
  {
    id: "ac-07",
    description: "Weekly summary → concise response under 150 words covering key metrics",
    input: { question: "Give me a summary of how the app is performing this week.", data: MOCK_DATA },
    graders: [
      {
        type: "llm-judge",
        criteria: "The response is concise (under 150 words as instructed), covers the main KPIs (users, page views, alerts), and uses bullet points or structured formatting. A response over 150 words or missing key metrics scores 1-2.",
        passMark: 4,
      },
    ],
  },
  {
    id: "ac-08",
    description: "Launch readiness → honest pre-launch assessment citing test traffic context",
    input: { question: "Is the app ready to launch publicly?", data: MOCK_DATA },
    graders: [
      {
        type: "llm-judge",
        criteria: "The response gives an honest assessment: notes the app is pre-launch and most signups are automated tests (as stated in CONTEXT). It does NOT say 'yes ready to launch' without major caveats about the test traffic. It acknowledges the early-stage nature.",
        passMark: 4,
      },
      { type: "regex", pattern: "pre-launch|early.stage|test|automated", flags: "i" },
    ],
  },
];

// ─── Runners ──────────────────────────────────────────────────────────────────

export async function runAnalyticsPromptSuite() {
  return runSuite(
    "07a — Analytics System Prompt",
    "Verifies the analytics prompt correctly injects KPIs, timelines, top pages, context notes. Free/instant.",
    promptCases,
    async ({ data }: PromptInput) => buildAnalyticsSystemPrompt(data)
  );
}

export async function runAnalyticsResponseSuite() {
  return runSuite(
    "07b — Analytics Chat Quality (LLM)",
    "Analytics Q&A responses using Claude haiku as proxy for GPT-4o-mini. Tests data accuracy, scope, honesty.",
    responseCases,
    async (input: AnalyticsChatInput) => callAnalyticsLLM(input)
  );
}
