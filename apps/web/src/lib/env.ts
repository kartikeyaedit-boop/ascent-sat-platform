import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  // Preferred: Resend's HTTP API (works on serverless — SMTP ports are
  // blocked outbound on most serverless platforms, including Vercel).
  RESEND_API_KEY: z.string().optional(),
  // Fallback: generic SMTP, for non-serverless deployments or other
  // providers. Ignored if RESEND_API_KEY is set.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().default("Cadence <noreply@cadence.dev>"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  // Explicit opt-in (not inferred from NODE_ENV) so E2E tests can run the
  // test-only routes against a production build without permanently
  // exposing them whenever NODE_ENV happens to be non-production.
  ENABLE_TEST_ENDPOINTS: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  APP_URL: process.env.APP_URL,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY || undefined,
  SMTP_HOST: process.env.SMTP_HOST || undefined,
  SMTP_PORT: process.env.SMTP_PORT || undefined,
  SMTP_USER: process.env.SMTP_USER || undefined,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || undefined,
  EMAIL_FROM: process.env.EMAIL_FROM,
  NODE_ENV: process.env.NODE_ENV,
  ENABLE_TEST_ENDPOINTS: process.env.ENABLE_TEST_ENDPOINTS,
});
