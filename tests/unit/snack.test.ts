import { afterEach, describe, expect, it, vi } from "vitest";
import { Snack } from "../../src/game/entities/Snack";

describe("Snack", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("weights +20 and +50 rewards at a 2:1 ratio", () => {
    const counts = new Map<number, number>();

    for (let slot = 0; slot < 12; slot++) {
      let call = 0;
      vi.spyOn(Math, "random").mockImplementation(() => {
        call += 1;
        return call === 1 ? (slot + 0.01) / 12 : 0;
      });

      const snack = new Snack(slot, 400);
      counts.set(snack.points, (counts.get(snack.points) ?? 0) + 1);
      vi.restoreAllMocks();
    }

    expect(counts.get(20)).toBe(8);
    expect(counts.get(50)).toBe(4);
  });
});
