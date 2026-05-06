import { describe, expect, it } from "vitest";
import { getSpeedMultiplier } from "../../src/game/GameEngine";

describe("GameEngine speed", () => {
  it("starts at normal speed", () => {
    expect(getSpeedMultiplier(0)).toBe(1);
  });

  it("ramps linearly throughout the round", () => {
    expect(getSpeedMultiplier(17_500)).toBe(1.5);
  });

  it("caps at 2x by the end of the round", () => {
    expect(getSpeedMultiplier(35_000)).toBe(2);
    expect(getSpeedMultiplier(40_000)).toBe(2);
  });
});
