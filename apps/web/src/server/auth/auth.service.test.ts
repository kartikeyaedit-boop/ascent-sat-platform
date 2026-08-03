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
import { registerUser, loginUser, refreshSession, changePassword } from "./auth.service";

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
  equippedPetId: null,
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

  it("creates an already-verified user and sends a welcome email on success", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);
    mockedPrisma.user.create.mockResolvedValue(baseUser);
    mockedPrisma.emailVerificationToken.create.mockResolvedValue({} as never);

    const user = await registerUser({
      email: baseUser.email,
      password: "Password1",
      name: "Jane Doe",
    });

    expect(user.email).toBe(baseUser.email);
    expect(user.emailVerified).toBe(true);
    expect(mockedPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ emailVerified: true }) }),
    );
    expect(sendEmail).toHaveBeenCalledOnce();
  });

  it("still succeeds even when the welcome email fails to send", async () => {
    // This is the actual production bug being guarded against: a
    // transactional email provider that can only deliver to its own
    // verified sender address rejects every other recipient, which used
    // to crash the whole registration request with a 500.
    mockedPrisma.user.findUnique.mockResolvedValue(null);
    mockedPrisma.user.create.mockResolvedValue(baseUser);
    mockedPrisma.emailVerificationToken.create.mockResolvedValue({} as never);
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error("Resend API error (403)"));

    const user = await registerUser({
      email: baseUser.email,
      password: "Password1",
      name: "Jane Doe",
    });

    expect(user.email).toBe(baseUser.email);
    expect(user.emailVerified).toBe(true);
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

describe("changePassword", () => {
  it("throws INVALID_CREDENTIALS when the current password is wrong", async () => {
    const passwordHash = await hashPassword("CorrectPassword1");
    mockedPrisma.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash });

    await expect(
      changePassword(baseUser.id, "WrongPassword1", "NewPassword1"),
    ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
  });

  it("updates the password hash and revokes other sessions on success", async () => {
    const passwordHash = await hashPassword("CorrectPassword1");
    mockedPrisma.user.findUnique.mockResolvedValue({ ...baseUser, passwordHash });
    mockedPrisma.user.update.mockResolvedValue({} as never);
    mockedPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 } as never);

    await changePassword(baseUser.id, "CorrectPassword1", "NewPassword1");

    expect(mockedPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: baseUser.id } }),
    );
    expect(mockedPrisma.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: baseUser.id, revokedAt: null } }),
    );
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
