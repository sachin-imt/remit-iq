/**
 * Phase 1: Anthropic Client Setup
 *
 * This file does one thing: creates a shared Anthropic client.
 *
 * WHY a shared instance?
 * - Next.js API routes can be warm (reused between requests on Vercel)
 * - Creating a new client each time wastes memory and re-reads env vars
 * - One instance, used everywhere in src/lib/ai/
 *
 * HOW it works:
 * - `new Anthropic()` automatically reads ANTHROPIC_API_KEY from process.env
 * - No need to pass the key manually — the SDK handles it
 */

import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic();

/**
 * Model selection.
 *
 * claude-opus-4-6   → Best reasoning, great for learning (~$0.05/message)
 * claude-haiku-4-5  → Fastest + cheapest for production (~$0.002/message)
 *
 * Switch to haiku once you're happy with the quality and want to reduce costs.
 */
export const CHAT_MODEL = "claude-haiku-4-5" as const;
