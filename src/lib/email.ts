/**
 * Email Service — Sends rate alert notifications via Resend
 * ==========================================================
 * Free tier: 100 emails/day, 3,000/month
 * Requires RESEND_API_KEY environment variable
 */

import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (_resend) return _resend;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Email] RESEND_API_KEY not set — emails will be logged but not sent");
    return null;
  }
  _resend = new Resend(apiKey);
  return _resend;
}

const FROM_EMAIL = "RemitIQ Alerts <alerts@remitiq.co>";
const FROM_EMAIL_PRIVACY = "RemitIQ Privacy <privacy@remitiq.co>";

// CAN-SPAM requires a physical mailing address in commercial emails
const PHYSICAL_ADDRESS = "RemitIQ · Sydney, NSW, Australia";

const EMAIL_FOOTER = `
    <div style="border-top:1px solid #1E3A5F;margin-top:24px;padding-top:16px;">
      <p style="color:#4A6A8A;font-size:11px;text-align:center;margin:0;">
        ${PHYSICAL_ADDRESS}<br>
        <a href="https://remitiq.co/privacy" style="color:#7A9CC4;">Privacy Policy</a>
      </p>
    </div>`;

interface RateAlertParams {
  to: string;
  targetRate: number;
  currentRate: number;
  midMarketRate: number;
}

interface BestDealAlertParams {
  to: string;
  bestPlatform: string;
  bestRate: number;
  midMarketRate: number;
  savings: string;
}

/**
 * Send a rate target alert email.
 */
export async function sendRateAlert(params: RateAlertParams): Promise<boolean> {
  try {
    const { to, targetRate, currentRate, midMarketRate } = params;
    const resend = getResend();

    if (!resend) {
      console.log(`[Email] Would send rate alert to ${to}: ₹${currentRate.toFixed(2)} (target: ₹${targetRate.toFixed(2)}) — RESEND_API_KEY not set`);
      return true; // Return true so the alert is marked as triggered
    }

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `🎯 AUD/INR hit your target! Now ₹${currentRate.toFixed(2)}`,
      headers: {
        "List-Unsubscribe": "<https://remitiq.co/alerts>",
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      text: `Rate Target Hit! AUD/INR is now ₹${currentRate.toFixed(2)} (your target: ₹${targetRate.toFixed(2)}). Compare platforms at https://remitiq.co\n\nTo stop receiving alerts, visit https://remitiq.co/alerts\n\n${PHYSICAL_ADDRESS}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0A1628;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="background:#F0B429;color:#0A1628;font-weight:800;padding:6px 14px;border-radius:8px;font-size:18px;">RQ</span>
      <span style="color:white;font-size:20px;font-weight:700;margin-left:8px;">Remit<span style="color:#F0B429;">IQ</span></span>
    </div>

    <div style="background:#111D32;border:1px solid #1E3A5F;border-radius:16px;padding:32px;text-align:center;">
      <div style="font-size:48px;margin-bottom:12px;">🎯</div>
      <h1 style="color:white;font-size:24px;margin:0 0 8px;">Rate Target Hit!</h1>
      <p style="color:#7A9CC4;font-size:16px;margin:0 0 24px;">AUD/INR has reached your target rate</p>

      <div style="background:#0D1B2E;border-radius:12px;padding:20px;margin-bottom:20px;">
        <div style="color:#7A9CC4;font-size:13px;margin-bottom:4px;">Current Best Rate</div>
        <div style="color:#4ADE80;font-size:36px;font-weight:800;">₹${currentRate.toFixed(2)}</div>
        <div style="color:#7A9CC4;font-size:13px;margin-top:8px;">Your target: ₹${targetRate.toFixed(2)} · Mid-market: ₹${midMarketRate.toFixed(2)}</div>
      </div>

      <a href="https://remitiq.co" style="display:inline-block;background:#F0B429;color:#0A1628;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:16px;">
        Compare Platforms Now →
      </a>
    </div>

    <p style="color:#4A6A8A;font-size:12px;text-align:center;margin-top:20px;">
      You're receiving this because you set a rate alert on RemitIQ.<br>
      <a href="https://remitiq.co/alerts" style="color:#7A9CC4;">Unsubscribe · Manage alerts</a>
    </p>
    ${EMAIL_FOOTER}
  </div>
</body>
</html>`,
    });

    if (error) {
      console.error("[Email] Failed to send rate alert:", error);
      return false;
    }

    console.log(`[Email] Rate alert sent to ${to} (rate: ₹${currentRate})`);
    return true;
  } catch (error) {
    console.error("[Email] Error sending rate alert:", error);
    return false;
  }
}

/**
 * Send a best deal alert email.
 */
export async function sendBestDealAlert(params: BestDealAlertParams): Promise<boolean> {
  try {
    const { to, bestPlatform, bestRate, midMarketRate, savings } = params;
    const resend = getResend();

    if (!resend) {
      console.log(`[Email] Would send best deal alert to ${to}: ${bestPlatform} ₹${bestRate.toFixed(2)} — RESEND_API_KEY not set`);
      return true;
    }

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `💰 ${bestPlatform} is offering a great deal — ₹${bestRate.toFixed(2)}`,
      headers: {
        "List-Unsubscribe": "<https://remitiq.co/alerts>",
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      text: `Great Deal Alert! ${bestPlatform} is offering ₹${bestRate.toFixed(2)} (mid-market: ₹${midMarketRate.toFixed(2)}, save ${savings}). Compare at https://remitiq.co\n\nTo stop receiving alerts, visit https://remitiq.co/alerts\n\n${PHYSICAL_ADDRESS}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0A1628;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="background:#F0B429;color:#0A1628;font-weight:800;padding:6px 14px;border-radius:8px;font-size:18px;">RQ</span>
      <span style="color:white;font-size:20px;font-weight:700;margin-left:8px;">Remit<span style="color:#F0B429;">IQ</span></span>
    </div>

    <div style="background:#111D32;border:1px solid #1E3A5F;border-radius:16px;padding:32px;text-align:center;">
      <div style="font-size:48px;margin-bottom:12px;">💰</div>
      <h1 style="color:white;font-size:24px;margin:0 0 8px;">Great Deal Alert!</h1>
      <p style="color:#7A9CC4;font-size:16px;margin:0 0 24px;">${bestPlatform} is offering an excellent rate right now</p>

      <div style="background:#0D1B2E;border-radius:12px;padding:20px;margin-bottom:20px;">
        <div style="color:#7A9CC4;font-size:13px;margin-bottom:4px;">${bestPlatform} Rate</div>
        <div style="color:#4ADE80;font-size:36px;font-weight:800;">₹${bestRate.toFixed(2)}</div>
        <div style="color:#7A9CC4;font-size:13px;margin-top:8px;">Mid-market: ₹${midMarketRate.toFixed(2)} · Save ${savings}</div>
      </div>

      <a href="https://remitiq.co" style="display:inline-block;background:#F0B429;color:#0A1628;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:16px;">
        Send Money Now →
      </a>
    </div>

    <p style="color:#4A6A8A;font-size:12px;text-align:center;margin-top:20px;">
      You're receiving this because you set a best deal alert on RemitIQ.<br>
      <a href="https://remitiq.co/alerts" style="color:#7A9CC4;">Unsubscribe · Manage alerts</a>
    </p>
    ${EMAIL_FOOTER}
  </div>
</body>
</html>`,
    });

    if (error) {
      console.error("[Email] Failed to send best deal alert:", error);
      return false;
    }

    console.log(`[Email] Best deal alert sent to ${to} (${bestPlatform}: ₹${bestRate})`);
    return true;
  } catch (error) {
    console.error("[Email] Error sending best deal alert:", error);
    return false;
  }
}

/**
 * Send a verification code email for data export/deletion requests.
 */
export async function sendVerificationEmail(params: { to: string; code: string }): Promise<boolean> {
  try {
    const { to, code } = params;
    const resend = getResend();

    if (!resend) {
      console.log(`[Email] Would send verification code to ${to}: ${code} — RESEND_API_KEY not set`);
      return true;
    }

    const { error } = await resend.emails.send({
      from: FROM_EMAIL_PRIVACY,
      to,
      subject: `Your RemitIQ Verification Code: ${code}`,
      text: `Your verification code is: ${code}. This code expires in 10 minutes. If you did not request this, you can safely ignore this email.\n\n${PHYSICAL_ADDRESS}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0A1628;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="background:#F0B429;color:#0A1628;font-weight:800;padding:6px 14px;border-radius:8px;font-size:18px;">RQ</span>
      <span style="color:white;font-size:20px;font-weight:700;margin-left:8px;">Remit<span style="color:#F0B429;">IQ</span></span>
    </div>

    <div style="background:#111D32;border:1px solid #1E3A5F;border-radius:16px;padding:32px;text-align:center;">
      <div style="font-size:48px;margin-bottom:12px;">&#128274;</div>
      <h1 style="color:white;font-size:24px;margin:0 0 8px;">Verification Code</h1>
      <p style="color:#7A9CC4;font-size:16px;margin:0 0 24px;">Use this code to manage your data on RemitIQ</p>

      <div style="background:#0D1B2E;border-radius:12px;padding:20px;margin-bottom:20px;">
        <div style="color:#7A9CC4;font-size:13px;margin-bottom:8px;">Your Code</div>
        <div style="color:#F0B429;font-size:40px;font-weight:800;letter-spacing:8px;font-family:monospace;">${code}</div>
        <div style="color:#7A9CC4;font-size:13px;margin-top:12px;">Expires in 10 minutes</div>
      </div>
    </div>

    <p style="color:#4A6A8A;font-size:12px;text-align:center;margin-top:20px;">
      If you didn't request this code, you can safely ignore this email.<br>
      <a href="https://remitiq.co/privacy" style="color:#7A9CC4;">Privacy Policy</a>
    </p>
    ${EMAIL_FOOTER}
  </div>
</body>
</html>`,
    });

    if (error) {
      console.error("[Email] Failed to send verification email:", error);
      return false;
    }

    console.log(`[Email] Verification code sent to ${to}`);
    return true;
  } catch (error) {
    console.error("[Email] Error sending verification email:", error);
    return false;
  }
}
