/**
 * POST /api/alerts — Create a rate alert
 * GET  /api/alerts — Get alert stats
 */

import { NextResponse } from "next/server";
import { insertAlert, getAlertCount } from "@/lib/db";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, targetRate, alertType } = body;

        // Validate
        if (!email || !email.includes("@")) {
            return NextResponse.json(
                { error: "Valid email is required" },
                { status: 400 }
            );
        }

        if (!targetRate || typeof targetRate !== "number" || targetRate < 55 || targetRate > 75) {
            return NextResponse.json(
                { error: "Target rate must be between 55 and 75" },
                { status: 400 }
            );
        }

        const validTypes = ["rate", "platform", "both"];
        const type = validTypes.includes(alertType) ? alertType : "both";

        const id = await insertAlert(email, targetRate, type);

        console.log(`[Alerts] New alert #${id}: ${email} → ₹${targetRate} (${type})`);

        return NextResponse.json(
            {
                success: true,
                id,
                email,
                targetRate,
                alertType: type,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("[Alerts] Error creating alert:", error);
        return NextResponse.json(
            { error: "Failed to create alert" },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const counts = await getAlertCount();
        return NextResponse.json(counts);
    } catch (error) {
        console.error("[Alerts] Error getting stats:", error);
        return NextResponse.json(
            { error: "Failed to get alert stats" },
            { status: 500 }
        );
    }
}
