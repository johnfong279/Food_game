import { describe, it, expect } from "vitest";
import { ScoreSubmitRequestSchema } from "../../src/schemas/score";
import { EmailSubmitRequestSchema } from "../../src/schemas/email";
import { LeaderboardEntrySchema } from "../../src/schemas/leaderboard";

describe("ScoreSubmitRequestSchema", () => {
  const valid = {
    sessionToken: "tok",
    score: 42,
    petalsCaught: 10,
    snacksCaught: 2,
    durationMs: 60000,
    events: [{ type: "petal_catch", timestamp: 1000 }],
  };

  it("accepts a valid payload", () => {
    expect(ScoreSubmitRequestSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects negative score", () => {
    expect(ScoreSubmitRequestSchema.safeParse({ ...valid, score: -1 }).success).toBe(false);
  });

  it("rejects unknown event type", () => {
    const bad = { ...valid, events: [{ type: "hack", timestamp: 1000 }] };
    expect(ScoreSubmitRequestSchema.safeParse(bad).success).toBe(false);
  });
});

describe("EmailSubmitRequestSchema", () => {
  it("accepts valid email + consent", () => {
    const payload = {
      sessionToken: "tok",
      displayName: "Snack Player",
      email: "test@example.com",
      consent: true as const,
    };
    expect(EmailSubmitRequestSchema.safeParse(payload).success).toBe(true);
  });

  it("rejects missing consent", () => {
    const payload = {
      sessionToken: "tok",
      displayName: "Snack Player",
      email: "test@example.com",
      consent: false,
    };
    expect(EmailSubmitRequestSchema.safeParse(payload).success).toBe(false);
  });

  it("rejects invalid email", () => {
    const payload = {
      sessionToken: "tok",
      displayName: "Snack Player",
      email: "not-an-email",
      consent: true,
    };
    expect(EmailSubmitRequestSchema.safeParse(payload).success).toBe(false);
  });

  it("rejects missing display name", () => {
    const payload = { sessionToken: "tok", email: "test@example.com", consent: true };
    expect(EmailSubmitRequestSchema.safeParse(payload).success).toBe(false);
  });

  it("rejects long display name", () => {
    const payload = {
      sessionToken: "tok",
      displayName: "Name that is too long",
      email: "test@example.com",
      consent: true,
    };
    expect(EmailSubmitRequestSchema.safeParse(payload).success).toBe(false);
  });
});

describe("LeaderboardEntrySchema", () => {
  it("accepts entries with names", () => {
    expect(
      LeaderboardEntrySchema.safeParse({
        rank: 1,
        name: "Lily",
        score: 512,
        createdAt: new Date().toISOString(),
      }).success
    ).toBe(true);
  });
});
