import { describe, it, expect } from "vitest";
import { ScoreSubmitRequestSchema } from "../../src/schemas/score";
import { EmailSubmitRequestSchema } from "../../src/schemas/email";
import { LeaderboardEntrySchema, LeaderboardResponseSchema } from "../../src/schemas/leaderboard";
import { AnalyticsTrackRequestSchema } from "../../src/schemas/analytics";

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

describe("LeaderboardResponseSchema", () => {
  it("accepts the current player entry outside the top 10", () => {
    expect(
      LeaderboardResponseSchema.safeParse({
        top10: [],
        yourRank: 14,
        yourEntry: {
          rank: 14,
          name: "Lily",
          score: 256,
          createdAt: new Date().toISOString(),
        },
      }).success
    ).toBe(true);
  });
});

describe("AnalyticsTrackRequestSchema", () => {
  it("accepts valid analytics events", () => {
    expect(
      AnalyticsTrackRequestSchema.safeParse({
        eventName: "start_game_click",
        eventType: "button_click",
        sessionToken: "tok",
        metadata: { score: 100, source: "landing", complete: true, empty: null },
      }).success
    ).toBe(true);
  });

  it("rejects unknown event names", () => {
    expect(
      AnalyticsTrackRequestSchema.safeParse({
        eventName: "unknown_click",
        eventType: "button_click",
      }).success
    ).toBe(false);
  });

  it("rejects nested metadata", () => {
    expect(
      AnalyticsTrackRequestSchema.safeParse({
        eventName: "start_game_click",
        eventType: "button_click",
        metadata: { nested: { value: true } },
      }).success
    ).toBe(false);
  });
});
