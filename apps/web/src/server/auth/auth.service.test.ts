import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    emailVerificationToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
    },
    passwordResetToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  },
}));

vi.mock("./mailer", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
  verificationEmail: vi.fn(() => ({ subject: "s", html: "h", text: "t" })),
  passwordResetEmail: vi.fn(() => ({ subject: "s", html: "h", text: "t" })),
}));

import { prisma } from "@/lib/prisma";
import { sendEmail } from "./mailer";
import { hashPassword } from "./password";
import { registerUser, loginUser, refreshSession } from "./auth.service";

const mockedPrisma = vi.mocked(prisma, { deep: true });

const baseUser = {
  id: "user_1",
  email: "jane@example.com",
  name: "Jane Doe",
  avatarUrl: null,
  role: "STUDENT" as const,
  emailVerified: true,
  xp: 0,
  coins: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastPracticeDate: null,
  equippedTitleId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  passwordHash: "",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("registerUser", () => {
  it("throws EMAIL_TAKEN when the email is already registered", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(baseUser);

    await expect(
      registerUser({
        email: baseUser.email,
        password: "Password1",
        name: "Jane",
      }),
    ).rejects.toMatchObject({ code: "EMAIL_TAKEN" });
  });

  it("creates a user and sends a verification email on success", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);
    mockedPrisma.user.create.mockResolvedValue({
      ...baseUser,
      emailVerified: false,
    });
    mockedPrisma.emailVerificationToken.create.mockResolvedValue({} as never);

    const user = await registerUser({
      email: baseUser.email,
      password: "Password1",
      name: "Jane Doe",
    });

    expect(user.email).toBe(baseUser.email);
    expect(mockedPrisma.user.create).toHaveBeenCalledOnce();
    expect(sendEmail).toHaveBeenCalledOnce();
  });
});

describe("loginUser", () => {
  it("throws INVALID_CREDENTIALS for an unknown email", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);

    await expect(
      loginUser({ email: "nobody@example.com", password: "whatever" }),
    ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
  });

  it("throws INVALID_CREDENTIALS for a wrong password", async () => {
    const passwordHash = await hashPassword("CorrectPassword1");
    mockedPrisma.user.findUnique.mockResolvedValue({
      ...baseUser,
      passwordHash,
    });

    await expect(
      loginUser({ email: baseUser.email, password: "WrongPassword1" }),
    ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
  });

  it("throws EMAIL_NOT_VERIFIED for an unverified account with correct credentials", async () => {
    const passwordHash = await hashPassword("CorrectPassword1");
    mockedPrisma.user.findUnique.mockResolvedValue({
      ...baseUser,
      passwordHash,
      emailVerified: false,
    });

    await expect(
      loginUser({ email: baseUser.email, password: "CorrectPassword1" }),
    ).rejects.toMatchObject({ code: "EMAIL_NOT_VERIFIED" });
  });

  it("returns a user and session tokens on success", async () => {
    const passwordHash = await hashPassword("CorrectPassword1");
    mockedPrisma.user.findUnique.mockResolvedValue({
      ...baseUser,
      passwordHash,
    });
    mockedPrisma.refreshToken.create.mockResolvedValue({} as never);

    const result = await loginUser({
      email: baseUser.email,
      password: "CorrectPassword1",
    });

    expect(result.user.email).toBe(baseUser.email);
    expect(result.tokens.accessToken).toEqual(expect.any(String));
    expect(result.tokens.refreshToken).toEqual(expect.any(String));
  });
});

describe("refreshSession", () => {
  it("throws UNAUTHENTICATED for an unknown token", async () => {
    mockedPrisma.refreshToken.findUnique.mockResolvedValue(null);

    await expect(refreshSession("bogus-token")).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
  });

  it("throws UNAUTHENTICATED for an expired token", async () => {
    mockedPrisma.refreshToken.findUnique.mockResolvedValue({
      id: "rt_1",
      userId: baseUser.id,
      tokenHash: "hash",
      expiresAt: new Date(Date.now() - 1000),
      revokedAt: null,
      createdAt: new Date(),
      user: baseUser,
    } as never);

    await expect(refreshSession("expired-token")).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
  });

  it("throws UNAUTHENTICATED for an already-revoked token", async () => {
    mockedPrisma.refreshToken.findUnique.mockResolvedValue({
      id: "rt_1",
      userId: baseUser.id,
      tokenHash: "hash",
      expiresAt: new Date(Date.now() + 1000 * 60),
      revokedAt: new Date(),
      createdAt: new Date(),
      user: baseUser,
    } as never);

    await expect(refreshSession("revoked-token")).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
  });

  it("rotates the token and issues a new session on success", async () => {
    mockedPrisma.refreshToken.findUnique.mockResolvedValue({
      id: "rt_1",
      userId: baseUser.id,
      tokenHash: "hash",
      expiresAt: new Date(Date.now() + 1000 * 60),
      revokedAt: null,
      createdAt: new Date(),
      user: baseUser,
    } as never);
    mockedPrisma.refreshToken.update.mockResolvedValue({} as never);
    mockedPrisma.refreshToken.create.mockResolvedValue({} as never);

    const result = await refreshSession("valid-token");

    expect(mockedPrisma.refreshToken.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "rt_1" } }),
    );
    expect(result.tokens.accessToken).toEqual(expect.any(String));
  });
});
