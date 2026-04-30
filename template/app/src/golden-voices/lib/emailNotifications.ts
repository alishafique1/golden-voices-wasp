/**
 * Resend Email Notifications
 */

import { env } from "wasp/server";

const RESEND_API_KEY = env.RESEND_API_KEY ?? "";
const FROM_EMAIL = "Golden Voices <no-reply@goldenvoices.app>";

interface CallCompletedEmailParams {
  to: string;
  seniorName: string;
  callDate: string;
  callId: string;
}

export async function sendCallCompletedEmail(params: CallCompletedEmailParams): Promise<void> {
  if (!RESEND_API_KEY) {
    console.log("[Email] RESEND_API_KEY not set, skipping email");
    return;
  }

  const { to, seniorName, callDate, callId } = params;
  const dateStr = new Date(callDate).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #FDF8F3; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 20px rgba(0,0,0,0.08); }
    .header { background: #1A1A2E; padding: 32px 40px; }
    .logo { color: #D4AF37; font-size: 24px; font-weight: 700; }
    .tagline { color: #F59E0B; font-size: 13px; margin-top: 4px; }
    .body { padding: 32px 40px; }
    .headline { font-size: 20px; font-weight: 600; color: #1A1A2E; margin: 0 0 16px; }
    p { color: #444; line-height: 1.6; margin: 0 0 16px; }
    .card { background: #FDF8F3; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .btn { display: inline-block; background: #D4AF37; color: #1A1A2E; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px; }
    .footer { padding: 24px 40px; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Golden Voices</div>
      <div class="tagline">Daily connection for the people who matter most</div>
    </div>
    <div class="body">
      <h2 class="headline">Your call with ${seniorName} is complete</h2>
      <p>Your AI companion just finished a conversation with ${seniorName}. Here's what happened:</p>
      <div class="card">
        <p style="margin:0"><strong>Date:</strong> ${dateStr}</p>
        <p style="margin:8px 0 0"><strong>Status:</strong> Completed successfully</p>
      </div>
      <p>Log in to see the full summary — including mood insights, topics discussed, and any health notes.</p>
      <a href="${env.CLIENT_URL ?? "http://localhost:3000"}/dashboard/calls/${callId}" class="btn">View Summary</a>
    </div>
    <div class="footer">
      Golden Voices Connect &middot; You're receiving this because you have an active account.
    </div>
  </div>
</body>
</html>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject: `Your call with ${seniorName} is complete`,
      html,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Resend email failed: ${response.status} ${err}`);
  }
}
