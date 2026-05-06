import { afterEach, describe, it, expect, vi } from "vitest";
import { Spawner } from "../../src/game/systems/Spawner";

describe("Spawner", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it("spawns bonus snacks more frequently late in the round", () => {
    const earlySpawner = new Spawner();
    const lateSpawner = new Spawner();
    let earlySnacks = 0;
    let lateSnacks = 0;

    for (let i = 0; i < 1000; i++) {
      earlySnacks += earlySpawner.update(0.01, 400, 0).snacks.length;
      lateSnacks += lateSpawner.update(0.01, 400, 1).snacks.length;
    }

    expect(lateSnacks).toBeGreaterThan(earlySnacks);
  });

  it("doubles reward spawn frequency in the final 10 seconds", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const spawner = new Spawner();
    let snacks = 0;

    for (let i = 0; i < 1000; i++) {
      snacks += spawner.update(0.01, 400, 1).snacks.length;
    }

    expect(snacks).toBe(18);
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
