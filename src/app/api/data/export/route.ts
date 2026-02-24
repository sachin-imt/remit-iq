import { NextResponse } from "next/server";
import { verifyCode, getAlertsByEmail } from "@/lib/db";

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

        const valid = await verifyCode(normalizedEmail, code, "export");
        if (!valid) {
            return NextResponse.json({ error: "Invalid or expired verification code." }, { status: 401 });
        }

        const alerts = await getAlertsByEmail(normalizedEmail);

        console.log(`[Data] Data exported for ${normalizedEmail} (${alerts.length} alerts)`);

        return NextResponse.json({
            success: true,
            data: {
                email: normalizedEmail,
                alerts: alerts.map((a) => ({
                    id: a.id,
                    target_rate: a.target_rate,
                    alert_type: a.alert_type,
                    is_active: !!a.is_active,
                    created_at: a.created_at,
                    triggered_at: a.triggered_at,
                    trigger_rate: a.trigger_rate,
                })),
                exported_at: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error("[Data] Error in export endpoint:", error);
        return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
}
