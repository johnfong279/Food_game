import { describe, expect, it } from "vitest";
import {
  buildDateRange,
  getDefaultAdminDateRange,
  parseAdminDateRange,
} from "../../src/lib/adminDashboard";

describe("admin dashboard date ranges", () => {
  it("builds an inclusive date range with an exclusive next-day end", () => {
    const range = buildDateRange("2026-05-01", "2026-05-06");

    expect(range.fromIso).toBe("2026-05-01T04:00:00.000Z");
    expect(range.toIsoExclusive).toBe("2026-05-07T04:00:00.000Z");
  });

  it("rejects invalid date format", () => {
    expect(() => buildDateRange("05/01/2026", "2026-05-06")).toThrow(
      "Dates must use YYYY-MM-DD format"
    );
  });

  it("rejects inverted date ranges", () => {
    expect(() => buildDateRange("2026-05-07", "2026-05-06")).toThrow(
      "From date must be before or equal to to date"
    );
  });

  it("uses provided query params when present", () => {
    const params = new URLSearchParams({ from: "2026-05-02", to: "2026-05-03" });
    expect(parseAdminDateRange(params).from).toBe("2026-05-02");
    expect(parseAdminDateRange(params).to).toBe("2026-05-03");
  });

  it("defaults to a seven-day window ending today", () => {
    const range = getDefaultAdminDateRange(new Date("2026-05-06T12:00:00.000Z"));
    expect(range.from).toBe("2026-04-30");
    expect(range.to).toBe("2026-05-06");
  });
});
