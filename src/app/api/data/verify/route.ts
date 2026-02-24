import { NextResponse } from "next/server";
import { createVerificationCode } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json(
                { error: "A valid email address is required." },
                { status: 400 }
            );
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Store hashed code (returns false if rate limited)
        const created = await createVerificationCode(normalizedEmail, code);
        if (!created) {
            return NextResponse.json(
                { error: "Too many requests. Please try again in an hour." },
                { status: 429 }
            );
        }

        // Send email
        const sent = await sendVerificationEmail({ to: normalizedEmail, code });
        if (!sent) {
            return NextResponse.json(
                { error: "Failed to send verification email. Please try again." },
                { status: 500 }
            );
        }

        console.log(`[Data] Verification code sent to ${normalizedEmail}`);

        return NextResponse.json({ success: true, message: "Verification code sent to your email." });
    } catch (error) {
        console.error("[Data] Error in verify endpoint:", error);
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}
