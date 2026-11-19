// Transactional email (password reset, email verification).
//
// Sent over an HTTPS API rather than SMTP: Render's free plan blocks
// outbound SMTP ports, and an API call is also faster and easier to debug.
//
//   EMAIL_PROVIDER = brevo | resend    (unset → email features are off)
//   EMAIL_API_KEY  = the provider's API key
//   EMAIL_FROM     = sender address, verified with the provider
//   EMAIL_FROM_NAME (optional, default "Warely")
//
// In development with no provider set, messages are printed to the
// console instead so the flows can still be tried end to end.

const PROVIDER = (process.env.EMAIL_PROVIDER || "").toLowerCase();
const API_KEY = process.env.EMAIL_API_KEY || "";
const FROM = process.env.EMAIL_FROM || "";
const FROM_NAME = process.env.EMAIL_FROM_NAME || "Warely";
const IS_DEV = process.env.NODE_ENV !== "production";

function emailEnabled() {
  if (PROVIDER && API_KEY && FROM) return true;
  return IS_DEV; // console delivery
}

// Absolute base URL for links in emails. Taken from configuration, never
// from the request's Host header — otherwise a forged header could make a
// reset link point at someone else's site.
function appUrl() {
  const url = process.env.APP_URL || (IS_DEV ? process.env.CLIENT_ORIGIN || "http://localhost:5173" : "");
  return url.replace(/\/+$/, "");
}

async function sendViaBrevo({ to, subject, html, text }) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": API_KEY, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      sender: { email: FROM, name: FROM_NAME },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Brevo responded ${res.status}: ${await res.text().catch(() => "")}`);
}

async function sendViaResend({ to, subject, html, text }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: `${FROM_NAME} <${FROM}>`, to: [to], subject, html, text }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Resend responded ${res.status}: ${await res.text().catch(() => "")}`);
}

async function sendEmail(message) {
  if (PROVIDER === "brevo" && API_KEY && FROM) return sendViaBrevo(message);
  if (PROVIDER === "resend" && API_KEY && FROM) return sendViaResend(message);
  if (IS_DEV) {
    console.log(`\n✉️  [dev email] to ${message.to}\n   ${message.subject}\n\n${message.text}\n`);
    return undefined;
  }
  throw new Error("Email is not configured (set EMAIL_PROVIDER, EMAIL_API_KEY and EMAIL_FROM)");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// One plain, mobile-friendly layout for every message: heading, a short
// paragraph, one button, and the raw link for clients that block buttons.
function layout({ heading, intro, buttonLabel, link, footnote }) {
  const html = `<!doctype html><html><body style="margin:0;background:#f6f7f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:32px">
<tr><td style="font-size:20px;font-weight:700;padding-bottom:4px">Warely</td></tr>
<tr><td style="font-size:18px;font-weight:600;padding:16px 0 8px">${escapeHtml(heading)}</td></tr>
<tr><td style="font-size:15px;line-height:1.6;color:#334155">${escapeHtml(intro)}</td></tr>
<tr><td style="padding:24px 0"><a href="${escapeHtml(link)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:8px">${escapeHtml(buttonLabel)}</a></td></tr>
<tr><td style="font-size:13px;line-height:1.6;color:#64748b">Or paste this link into your browser:<br><span style="word-break:break-all">${escapeHtml(link)}</span></td></tr>
<tr><td style="font-size:13px;line-height:1.6;color:#64748b;padding-top:16px">${escapeHtml(footnote)}</td></tr>
</table></td></tr></table></body></html>`;
  const text = `${heading}\n\n${intro}\n\n${buttonLabel}: ${link}\n\n${footnote}\n\n— Warely`;
  return { html, text };
}

function sendPasswordResetEmail(to, token) {
  const link = `${appUrl()}/reset-password?token=${token}`;
  const { html, text } = layout({
    heading: "Reset your password",
    intro: "Someone asked to reset the password for your Warely account. If it was you, choose a new password using the button below. The link works once and expires in 1 hour.",
    buttonLabel: "Choose a new password",
    link,
    footnote: "If you didn't ask for this, you can ignore this email — your password won't change.",
  });
  return sendEmail({ to, subject: "Reset your Warely password", html, text });
}

function sendVerificationEmail(to, token) {
  const link = `${appUrl()}/verify-email?token=${token}`;
  const { html, text } = layout({
    heading: "Confirm your email address",
    intro: "Confirm this is your email so you can use it to recover your Warely account. The link expires in 24 hours.",
    buttonLabel: "Confirm email",
    link,
    footnote: "If you didn't create a Warely account, you can ignore this email.",
  });
  return sendEmail({ to, subject: "Confirm your email for Warely", html, text });
}

function sendPasswordChangedEmail(to) {
  const link = `${appUrl()}/forgot-password`;
  const { html, text } = layout({
    heading: "Your password was changed",
    intro: "The password for your Warely account was just changed, and every other device was signed out.",
    buttonLabel: "Wasn't you? Reset it now",
    link,
    footnote: "If you made this change, there's nothing else to do.",
  });
  return sendEmail({ to, subject: "Your Warely password was changed", html, text });
}

// Security notice after a password change. Best effort: a mail outage
// must never block the change itself.
async function notifyPasswordChanged(user) {
  if (!user?.email || !user.emailVerified || !emailEnabled()) return;
  try {
    await sendPasswordChangedEmail(user.email);
  } catch (err) {
    console.error("Password-changed email failed:", err.message);
  }
}

module.exports = {
  emailEnabled,
  notifyPasswordChanged,
  appUrl,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendPasswordChangedEmail,
};
