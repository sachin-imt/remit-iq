import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY ?? "";

  // Make a direct test call to Anthropic from within Vercel
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 10,
      messages: [{ role: "user", content: "hi" }],
    }),
  });
  const data = await res.json();

  return NextResponse.json({
    key_prefix: key.slice(0, 20),
    key_suffix: key.slice(-6),
    key_length: key.length,
    anthropic_response: data,
  });
}
