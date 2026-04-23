import { describe, it, expect } from "vitest";

const MAX_PTS_PER_SEC = 50;

function isScoreValid(score: number, durationMs: number): boolean {
  return score <= MAX_PTS_PER_SEC * (durationMs / 1000);
}

describe("Anti-cheat score ceiling", () => {
  it("accepts a score within the ceiling", () => {
    expect(isScoreValid(2500, 60000)).toBe(true);
  });

  it("accepts a score exactly at the ceiling", () => {
    expect(isScoreValid(3000, 60000)).toBe(true);
  });

  it("rejects a score above the ceiling", () => {
    expect(isScoreValid(3001, 60000)).toBe(false);
  });

  it("rejects a large score in a short session", () => {
    expect(isScoreValid(1000, 5000)).toBe(false);
  });
});
