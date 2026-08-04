import { randomBytes, createHash } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";
import type { Role } from "@prisma/client";

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

const accessTokenSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: Role;
}

export async function signAccessToken(
  payload: AccessTokenPayload,
): Promise<string> {
  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(accessTokenSecret);
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, accessTokenSecret);
    if (
      !payload.sub ||
      typeof payload.email !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null;
    }
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

export const ACCESS_TOKEN_TTL_MS = ACCESS_TOKEN_TTL_SECONDS * 1000;

/** Generates a random opaque token. Returns the raw value (sent to the user)
 * and its SHA-256 hash (persisted). We never store raw tokens at rest. */
export function generateOpaqueToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("hex");
  return { raw, hash: hashOpaqueToken(raw) };
}

export function hashOpaqueToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Excludes visually-ambiguous characters (0/O, 1/I) since this gets
 * hand-typed back in during account recovery. */
const RECOVERY_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** A human-typable one-time-display secret (~80 bits of entropy), shown
 * once and never stored in plaintext — see recoveryCodeHash on User. */
export function generateRecoveryCode(): string {
  const bytes = randomBytes(16);
  let raw = "";
  for (let i = 0; i < bytes.length; i++) {
    raw += RECOVERY_CODE_ALPHABET[bytes[i] % RECOVERY_CODE_ALPHABET.length];
  }
  return raw.match(/.{1,4}/g)!.join("-");
}

/** Case- and formatting-insensitive: the user may retype it without dashes
 * or in lowercase, so both generation and verification hash this form. */
export function normalizeRecoveryCode(code: string): string {
  return code.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}
