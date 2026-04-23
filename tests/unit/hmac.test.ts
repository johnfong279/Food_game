import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  process.env.SESSION_SECRET = "test-secret-32-characters-long!!";
});

describe("HMAC sign/verify", () => {
  it("verifies a freshly signed token", async () => {
    const { signToken, verifyToken } = await import("../../src/lib/hmac");
    const payload = "session-123";
    const token = signToken(payload);
    expect(typeof token).toBe("string");
    const result = verifyToken(token);
    expect(result).toBe(payload);
  });

  it("returns null for a tampered token", async () => {
    const { signToken, verifyToken } = await import("../../src/lib/hmac");
    const token = signToken("session-abc");
    const tampered = token.slice(0, -4) + "XXXX";
    expect(verifyToken(tampered)).toBeNull();
  });

  it("returns null for garbage input", async () => {
    const { verifyToken } = await import("../../src/lib/hmac");
    expect(verifyToken("not-a-token")).toBeNull();
  });
});
