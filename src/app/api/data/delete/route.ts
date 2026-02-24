import { NextResponse } from "next/server";
import { verifyCode, deleteAlertsByEmail } from "@/lib/db";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, code } = body;

        if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
        }

        if (!code || typeof code !== "string" || code.length !== 6) {
            return NextResponse.json({ error: "A valid 6-digit code is required." }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const valid = await verifyCode(normalizedEmail, code, "delete");
        if (!valid) {
            return NextResponse.json({ error: "Invalid or expired verification code." }, { status: 401 });
        }

        const deleted = await deleteAlertsByEmail(normalizedEmail);

        console.log(`[Data] Data deleted for ${normalizedEmail} (${deleted} alerts removed)`);

        return NextResponse.json({
            success: true,
            deleted,
            message: `All your data has been deleted (${deleted} record${deleted !== 1 ? "s" : ""} removed).`,
        });
    } catch (error) {
        console.error("[Data] Error in delete endpoint:", error);
        return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
}
