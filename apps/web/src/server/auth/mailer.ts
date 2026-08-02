import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/lib/env";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * In dev/test (no email provider configured), the last email sent to each
 * address is kept in memory so E2E tests can retrieve verification/reset
 * links without needing a real inbox. Exposed only via a route guarded by
 * ENABLE_TEST_ENDPOINTS — see /api/test/last-email.
 */
const lastEmailByRecipient = new Map<string, SendEmailInput>();

export function getLastEmail(to: string): SendEmailInput | undefined {
  return lastEmailByRecipient.get(to);
}

async function sendViaResendApi(input: SendEmailInput): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Resend API error (${response.status}): ${body}`);
  }
}

let smtpTransporter: Transporter | null = null;

function getSmtpTransporter(): Transporter {
  if (!smtpTransporter) {
    smtpTransporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    });
  }
  return smtpTransporter;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  // Preferred: Resend's HTTP API. Outbound SMTP (port 587/465) is blocked
  // on most serverless platforms (including Vercel), so SMTP only works
  // for local/non-serverless runs.
  if (env.RESEND_API_KEY) {
    await sendViaResendApi(input);
    return;
  }

  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD) {
    await getSmtpTransporter().sendMail({
      from: env.EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    return;
  }

  // Development fallback: no provider configured, log instead of sending.
  lastEmailByRecipient.set(input.to, input);
  console.log(`\n[dev email] To: ${input.to}\nSubject: ${input.subject}\n${input.text}\n`);
}

export function verificationEmail(link: string) {
  return {
    subject: "Verify your email — Speechly",
    text: `Welcome! Verify your email by visiting: ${link}\nThis link expires in 24 hours.`,
    html: `<p>Welcome! Verify your email by clicking the link below.</p><p><a href="${link}">${link}</a></p><p>This link expires in 24 hours.</p>`,
  };
}

export function passwordResetEmail(link: string) {
  return {
    subject: "Reset your password — Speechly",
    text: `Reset your password by visiting: ${link}\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
    html: `<p>Reset your password by clicking the link below.</p><p><a href="${link}">${link}</a></p><p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>`,
  };
}
