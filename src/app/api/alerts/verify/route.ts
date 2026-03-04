import { NextResponse } from "next/server";
import { createVerificationCode } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email || !email.includes("@")) {
            return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
        }

        // Generate a 6-digit strict numerical OTP
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Database handles hashing and rate limiting (max 3 per hour per email)
        const canCreate = await createVerificationCode(email, code);

        if (!canCreate) {
            return NextResponse.json(
                { error: "Too many verification requests. Please try again in an hour." },
                { status: 429 }
            );
        }

        // Trigger Resend email. If RESEND_API_KEY is not set, this logs to console in dev mode
        const emailSent = await sendVerificationEmail({ to: email, code });

        if (!emailSent) {
            return NextResponse.json(
                { error: "Failed to send verification email. Please check configuration." },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, message: "Verification code sent securely." });
    } catch (error) {
        console.error("[Verify API] Error processing request:", error);
        return NextResponse.json({ error: "Failed to process verification request" }, { status: 500 });
    }
}
