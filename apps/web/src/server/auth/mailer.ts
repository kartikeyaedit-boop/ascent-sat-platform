import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/lib/env";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

let transporter: Transporter | null = null;

/**
 * In dev/test (no SMTP configured), the last email sent to each address is
 * kept in memory so E2E tests can retrieve verification/reset links without
 * needing a real inbox. Exposed only via a route guarded to non-production
 * environments — see /api/test/last-email.
 */
const lastEmailByRecipient = new Map<string, SendEmailInput>();

export function getLastEmail(to: string): SendEmailInput | undefined {
  return lastEmailByRecipient.get(to);
}

function getTransporter(): Transporter {
  if (transporter) return transporter;

  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    });
  } else {
    // Development fallback: no real SMTP configured, so emails are logged
    // to the server console instead of being sent.
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }

  return transporter;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const usingRealSmtp = Boolean(
    env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD,
  );
  const info = await getTransporter().sendMail({
    from: env.EMAIL_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (!usingRealSmtp) {
    lastEmailByRecipient.set(input.to, input);
    console.log(
      `\n[dev email] To: ${input.to}\nSubject: ${input.subject}\n${input.text}\n`,
      info.messageId,
    );
  }
}

export function verificationEmail(link: string) {
  return {
    subject: "Verify your email — SAT Platform",
    text: `Welcome! Verify your email by visiting: ${link}\nThis link expires in 24 hours.`,
    html: `<p>Welcome! Verify your email by clicking the link below.</p><p><a href="${link}">${link}</a></p><p>This link expires in 24 hours.</p>`,
  };
}

export function passwordResetEmail(link: string) {
  return {
    subject: "Reset your password — SAT Platform",
    text: `Reset your password by visiting: ${link}\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
    html: `<p>Reset your password by clicking the link below.</p><p><a href="${link}">${link}</a></p><p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>`,
  };
}
