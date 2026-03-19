import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // 1. Check Vercel's geo-location header (provided automatically on Vercel)
  const countryCode = request.headers.get("x-vercel-ip-country");

  if (countryCode) {
    return NextResponse.json({ countryCode });
  }

  // 2. Fallback for local development
  // We can use a free GeoIP service if we're not on Vercel
  try {
    const response = await fetch("https://ipapi.co/json/");
    const data = await response.json();
    if (data.country_code) {
      return NextResponse.json({ countryCode: data.country_code });
    }
  } catch (error) {
    console.error("Geo-detection fallback failed:", error);
  }

  // 3. Last resort fallback
  return NextResponse.json({ countryCode: "AU" });
}
