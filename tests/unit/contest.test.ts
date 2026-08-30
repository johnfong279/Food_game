import { describe, expect, it } from "vitest";
import { GAME_CLOSES_AT_ISO, isGameClosed } from "@/lib/contest";

describe("game close date", () => {
  it("uses 6 September 2026 23:59 in Toronto", () => {
    expect(GAME_CLOSES_AT_ISO).toBe("2026-09-07T03:59:00.000Z");
  });

  it("allows play before the close time", () => {
    expect(isGameClosed(new Date("2026-09-07T03:58:59.999Z").getTime())).toBe(false);
  });

  it("closes play at the close time", () => {
    expect(isGameClosed(new Date("2026-09-07T03:59:00.000Z").getTime())).toBe(true);
  });
});
