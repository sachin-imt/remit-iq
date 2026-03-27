import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY ?? "";
  return NextResponse.json({
    key_prefix: key.slice(0, 20),
    key_suffix: key.slice(-6),
    key_length: key.length,
  });
}
