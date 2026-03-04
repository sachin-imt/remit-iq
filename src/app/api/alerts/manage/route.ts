import { NextResponse } from "next/server";
import { verifyCode, getAlertsByEmail, deleteAlertsByEmail } from "@/lib/db";
import crypto from "crypto";

// Use resend key as a secret, or fallback for dev
const SECRET = process.env.RESEND_API_KEY || "remitiq_fallback_secret_324987239847";

/**
 * Generate a stateless authenticaton token so the user can
 * perform secure actions (like delete) on the dashboard without
 * re-sending an OTP.
 */
function generateAuthToken(email: string) {
    const hmac = crypto.createHmac("sha256", SECRET);
    hmac.update(email);
    return `${email}|${hmac.digest("hex")}`;
}

/**
 * Verify the token and extract the email address
 */
function verifyAuthToken(token: string): string | null {
    try {
        const [email, signature] = token.split("|");
        const hmac = crypto.createHmac("sha256", SECRET);
        hmac.update(email);
        if (hmac.digest("hex") === signature) {
            return email;
        }
    } catch {
        // ignore parsing errors
    }
    return null;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action } = body;

        if (!action) {
            return NextResponse.json({ error: "Missing action parameter" }, { status: 400 });
        }

        // --- ACTION: LOGIN / LIST ALERTS ---
        if (action === "list") {
            const { email, code } = body;
            if (!email || !code) {
                return NextResponse.json({ error: "Missing email or code" }, { status: 400 });
            }

            // Validate OTP (this marks the Postgres row as `used=TRUE`)
            const isValid = await verifyCode(email, code, "dashboard_login");
            if (!isValid) {
                return NextResponse.json(
                    { error: "Invalid or expired code. Please request a new one." },
                    { status: 401 }
                );
            }

            // Fetch user's data payload
            const alerts = await getAlertsByEmail(email);

            // Issue stateless JWT-like token for subsequent deletion actions
            const token = generateAuthToken(email);

            return NextResponse.json({ success: true, alerts, token });
        }

        // --- ACTION: DELETE ALL USER DATA ---
        if (action === "delete_all") {
            const { token } = body;
            if (!token) {
                return NextResponse.json({ error: "Missing authentication token" }, { status: 401 });
            }

            const verifiedEmail = verifyAuthToken(token);
            if (!verifiedEmail) {
                return NextResponse.json({ error: "Invalid session cookie" }, { status: 401 });
            }

            // Purge the database
            const deletedCount = await deleteAlertsByEmail(verifiedEmail);

            return NextResponse.json({
                success: true,
                message: `Successfully purged ${deletedCount} record(s).`
            });
        }

        return NextResponse.json({ error: "Invalid action type" }, { status: 400 });

    } catch (error) {
        console.error("[Manage API] Error Processing:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
