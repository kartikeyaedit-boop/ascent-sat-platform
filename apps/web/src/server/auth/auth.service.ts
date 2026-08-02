import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { AuthErrors } from "@/lib/errors";
import { hashPassword, verifyPassword } from "./password";
import {
  generateOpaqueToken,
  hashOpaqueToken,
  signAccessToken,
  verifyAccessToken,
  REFRESH_TOKEN_TTL_MS,
  EMAIL_VERIFICATION_TTL_MS,
  PASSWORD_RESET_TTL_MS,
} from "./tokens";
import { sendEmail, verificationEmail, passwordResetEmail } from "./mailer";
import type { User } from "@prisma/client";

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: User["role"];
  emailVerified: boolean;
  createdAt: Date;
}

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

async function issueSession(user: User): Promise<SessionTokens> {
  const accessToken = await signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  const { raw, hash } = generateOpaqueToken();
  const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hash,
      expiresAt: refreshTokenExpiresAt,
    },
  });

  return { accessToken, refreshToken: raw, refreshTokenExpiresAt };
}

async function sendVerificationEmail(user: User): Promise<void> {
  const { raw, hash } = generateOpaqueToken();
  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
    },
  });
  const link = `${env.APP_URL}/verify-email?token=${raw}`;
  const { subject, html, text } = verificationEmail(link);
  await sendEmail({ to: user.email, subject, html, text });
}

export async function registerUser(input: {
  email: string;
  password: string;
  name: string;
}): Promise<PublicUser> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) throw AuthErrors.emailTaken();

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: { email: input.email, passwordHash, name: input.name },
  });

  await sendVerificationEmail(user);
  return toPublicUser(user);
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<{ user: PublicUser; tokens: SessionTokens }> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !user.passwordHash) throw AuthErrors.invalidCredentials();

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) throw AuthErrors.invalidCredentials();

  if (!user.emailVerified) throw AuthErrors.emailNotVerified();

  const tokens = await issueSession(user);
  return { user: toPublicUser(user), tokens };
}

export async function refreshSession(
  rawRefreshToken: string,
): Promise<{ user: PublicUser; tokens: SessionTokens }> {
  const hash = hashOpaqueToken(rawRefreshToken);
  const existing = await prisma.refreshToken.findUnique({
    where: { tokenHash: hash },
    include: { user: true },
  });

  if (
    !existing ||
    existing.revokedAt ||
    existing.expiresAt.getTime() < Date.now()
  ) {
    throw AuthErrors.unauthenticated();
  }

  // Rotate: revoke the used token and issue a new one.
  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date() },
  });

  const tokens = await issueSession(existing.user);
  return { user: toPublicUser(existing.user), tokens };
}

export async function logoutUser(
  rawRefreshToken: string | undefined,
): Promise<void> {
  if (!rawRefreshToken) return;
  const hash = hashOpaqueToken(rawRefreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function verifyEmail(rawToken: string): Promise<void> {
  const hash = hashOpaqueToken(rawToken);
  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hash },
  });

  if (!record || record.expiresAt.getTime() < Date.now()) {
    throw AuthErrors.invalidOrExpiredToken();
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: true },
    }),
    prisma.emailVerificationToken.deleteMany({
      where: { userId: record.userId },
    }),
  ]);
}

export async function resendVerificationEmail(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  // Deliberately do not reveal whether the account exists.
  if (!user || user.emailVerified) return;
  await prisma.emailVerificationToken.deleteMany({
    where: { userId: user.id },
  });
  await sendVerificationEmail(user);
}

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  // Deliberately do not reveal whether the account exists.
  if (!user) return;

  const { raw, hash } = generateOpaqueToken();
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
    },
  });

  const link = `${env.APP_URL}/reset-password?token=${raw}`;
  const { subject, html, text } = passwordResetEmail(link);
  await sendEmail({ to: user.email, subject, html, text });
}

export async function resetPassword(
  rawToken: string,
  newPassword: string,
): Promise<void> {
  const hash = hashOpaqueToken(rawToken);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hash },
  });

  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
    throw AuthErrors.invalidOrExpiredToken();
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    // Revoke all existing sessions as a security measure after a password change.
    prisma.refreshToken.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
}

export async function getUserFromAccessToken(
  accessToken: string | undefined,
): Promise<PublicUser | null> {
  if (!accessToken) return null;
  const payload = await verifyAccessToken(accessToken);
  if (!payload) return null;

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) return null;
  return toPublicUser(user);
}
