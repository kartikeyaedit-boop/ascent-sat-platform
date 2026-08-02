import { describe, it, expect } from "vitest";
import {
  signAccessToken,
  verifyAccessToken,
  generateOpaqueToken,
  hashOpaqueToken,
} from "./tokens";

describe("access tokens", () => {
  const payload = {
    sub: "user_123",
    email: "jane@example.com",
    role: "STUDENT" as const,
  };

  it("round-trips a valid token", async () => {
    const token = await signAccessToken(payload);
    const decoded = await verifyAccessToken(token);
    expect(decoded).toEqual(payload);
  });

  it("rejects a garbage token", async () => {
    const decoded = await verifyAccessToken("not.a.valid.token");
    expect(decoded).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    // Simulate a forged/tampered token by corrupting the signature segment.
    const token = await signAccessToken(payload);
    const parts = token.split(".");
    const tampered = `${parts[0]}.${parts[1]}.${parts[2]!.slice(0, -2)}xx`;
    const decoded = await verifyAccessToken(tampered);
    expect(decoded).toBeNull();
  });
});

describe("opaque tokens", () => {
  it("generates a raw token whose hash matches hashOpaqueToken", () => {
    const { raw, hash } = generateOpaqueToken();
    expect(hashOpaqueToken(raw)).toBe(hash);
  });

  it("generates unique tokens on each call", () => {
    const a = generateOpaqueToken();
    const b = generateOpaqueToken();
    expect(a.raw).not.toBe(b.raw);
    expect(a.hash).not.toBe(b.hash);
  });

  it("never stores the raw value inside the hash", () => {
    const { raw, hash } = generateOpaqueToken();
    expect(hash).not.toContain(raw);
  });
});
