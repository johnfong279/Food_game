import { describe, it, expect } from "vitest";
import { Spawner } from "../../src/game/systems/Spawner";

describe("Spawner", () => {
  it("spawns a petal within 400ms", () => {
    const spawner = new Spawner();
    let petals = 0;
    for (let i = 0; i < 40; i++) {
      const { petals: p } = spawner.update(0.01, 400);
      petals += p.length;
    }
    expect(petals).toBeGreaterThanOrEqual(1);
  });

  it("spawns petals but not snacks within 2s", () => {
    const spawner = new Spawner();
    let snacks = 0;
    for (let i = 0; i < 200; i++) {
      const { snacks: s } = spawner.update(0.01, 400);
      snacks += s.length;
    }
    expect(snacks).toBe(0);
  });

  it("resets counters on reset()", () => {
    const spawner = new Spawner();
    for (let i = 0; i < 500; i++) spawner.update(0.01, 400);
    spawner.reset();
    const { petals, snacks } = spawner.update(0, 400);
    expect(petals.length).toBe(0);
    expect(snacks.length).toBe(0);
  });
});
