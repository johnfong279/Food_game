import { describe, expect, it } from "vitest";
import {
  buildDateRange,
  getAdminDashboardData,
  getDefaultAdminDateRange,
  parseAdminDateRange,
} from "../../src/lib/adminDashboard";

function createSupabaseStub({
  events,
  sessions = [],
  emails = [],
  scores = [],
}: {
  events: unknown[];
  sessions?: unknown[];
  emails?: unknown[];
  scores?: unknown[];
}) {
  const createCountQuery = (rows: unknown[]) => ({
    gte() {
      return {
        lt: async () => ({ data: null, count: rows.length, error: null }),
      };
    },
  });

  return {
    from(table: string) {
      if (table === "analytics_events") {
        return {
          select() {
            return {
              gte() {
                return {
                  lt() {
                    return {
                      order: async () => ({ data: events, error: null }),
                    };
                  },
                };
              },
            };
          },
        };
      }

      if (table === "sessions") {
        return {
          select() {
            return createCountQuery(sessions);
          },
        };
      }

      if (table === "emails") {
        return {
          select(columns: string) {
            if (columns === "id") return createCountQuery(emails);
            return {
              gte: () => ({
                lt: async () => ({ data: emails, error: null }),
              }),
            };
          },
        };
      }

      if (table === "scores") {
        return {
          select(columns: string) {
            if (columns === "id") return createCountQuery(scores);
            return {
              in: async () => ({ data: scores, error: null }),
            };
          },
        };
      }

      throw new Error(`Unexpected table ${table}`);
    },
  };
}

function createRecordingSupabaseStub({
  events,
  sessions = [],
  emails = [],
  scores = [],
}: {
  events: unknown[];
  sessions?: unknown[];
  emails?: unknown[];
  scores?: unknown[];
}) {
  const filters: Array<{ table: string; op: "gte" | "lt"; column: string; value: string }> = [];

  const createRangeQuery = (table: string, result: unknown) => ({
    gte(column: string, value: string) {
      filters.push({ table, op: "gte", column, value });
      return {
        lt(column: string, value: string) {
          filters.push({ table, op: "lt", column, value });
          return result;
        },
      };
    },
  });

  return {
    filters,
    supabase: {
      from(table: string) {
        if (table === "analytics_events") {
          return {
            select() {
              return createRangeQuery(table, {
                order: async () => ({ data: events, error: null }),
              });
            },
          };
        }

        if (table === "sessions") {
          return {
            select() {
              return createRangeQuery(
                table,
                Promise.resolve({ data: null, count: sessions.length, error: null })
              );
            },
          };
        }

        if (table === "emails") {
          return {
            select(columns: string) {
              return createRangeQuery(
                table,
                columns === "id"
                  ? Promise.resolve({ data: null, count: emails.length, error: null })
                  : Promise.resolve({ data: emails, error: null })
              );
            },
          };
        }

        if (table === "scores") {
          return {
            select(columns: string) {
              if (columns === "id") {
                return createRangeQuery(
                  table,
                  Promise.resolve({ data: null, count: scores.length, error: null })
                );
              }
              return {
                in: async () => ({ data: scores, error: null }),
              };
            },
          };
        }

        throw new Error(`Unexpected table ${table}`);
      },
    },
  };
}

describe("admin dashboard date ranges", () => {
  it("builds an inclusive date range with an exclusive next-day end", () => {
    const range = buildDateRange("2026-05-01", "2026-05-06");

    expect(range.fromIso).toBe("2026-05-01T04:00:00.000Z");
    expect(range.toIsoExclusive).toBe("2026-05-07T04:00:00.000Z");
  });

  it("uses Toronto day boundaries across daylight saving changes", () => {
    const spring = buildDateRange("2026-03-08", "2026-03-08");
    expect(spring.fromIso).toBe("2026-03-08T05:00:00.000Z");
    expect(spring.toIsoExclusive).toBe("2026-03-09T04:00:00.000Z");

    const fall = buildDateRange("2026-11-01", "2026-11-01");
    expect(fall.fromIso).toBe("2026-11-01T04:00:00.000Z");
    expect(fall.toIsoExclusive).toBe("2026-11-02T05:00:00.000Z");
  });

  it("rejects invalid date format", () => {
    expect(() => buildDateRange("05/01/2026", "2026-05-06")).toThrow(
      "Dates must use YYYY-MM-DD format"
    );
  });

  it("rejects impossible calendar dates", () => {
    expect(() => buildDateRange("2026-02-31", "2026-03-01")).toThrow(
      "Invalid date range"
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

  it("extends the exclusive end boundary when the to date moves forward", () => {
    const throughMay9 = buildDateRange("2026-05-01", "2026-05-09");
    const throughMay10 = buildDateRange("2026-05-01", "2026-05-10");

    expect(throughMay9.fromIso).toBe(throughMay10.fromIso);
    expect(throughMay9.toIsoExclusive).toBe("2026-05-10T04:00:00.000Z");
    expect(throughMay10.toIsoExclusive).toBe("2026-05-11T04:00:00.000Z");
    expect(new Date(throughMay10.toIsoExclusive).getTime()).toBeGreaterThan(
      new Date(throughMay9.toIsoExclusive).getTime()
    );
  });

  it("rejects slash-formatted query params such as 10/5/2026", () => {
    const params = new URLSearchParams({ from: "2026-05-01", to: "10/5/2026" });

    expect(() => parseAdminDateRange(params)).toThrow("Dates must use YYYY-MM-DD format");
  });

  it("defaults to a seven-day window ending today", () => {
    const range = getDefaultAdminDateRange(new Date("2026-05-06T12:00:00.000Z"));
    expect(range.from).toBe("2026-04-30");
    expect(range.to).toBe("2026-05-06");
  });
});

describe("admin dashboard metrics", () => {
  it("counts email submissions from email rows instead of client analytics success events", async () => {
    const range = buildDateRange("2026-05-01", "2026-05-01");
    const eventBase = {
      session_id: "session-1",
      event_type: "funnel",
      metadata: {},
      created_at: "2026-05-01T12:00:00.000Z",
    };

    const data = await getAdminDashboardData(
      createSupabaseStub({
        events: [
          { ...eventBase, event_name: "session_start_success" },
          { ...eventBase, event_name: "session_start_success", session_id: "session-2" },
          { ...eventBase, event_name: "session_start_success", session_id: "session-3" },
          { ...eventBase, event_name: "session_start_success", session_id: "session-4" },
          { ...eventBase, event_name: "email_submit_attempt" },
          { ...eventBase, event_name: "email_submit_attempt" },
          { ...eventBase, event_name: "email_submit_success" },
        ],
        sessions: [{ id: "session-1" }, { id: "session-2" }, { id: "session-3" }, { id: "session-4" }],
        scores: [{ session_id: "session-1", score: 100, created_at: "2026-05-01T12:04:00.000Z" }],
        emails: [
          {
            session_id: "session-1",
            display_name: "Player",
            created_at: "2026-05-01T12:05:00.000Z",
          },
          {
            session_id: "session-2",
            display_name: "Player 2",
            created_at: "2026-05-01T12:06:00.000Z",
          },
          {
            session_id: "session-3",
            display_name: "Player 3",
            created_at: "2026-05-01T12:07:00.000Z",
          },
        ],
      }) as never,
      range
    );

    expect(data.summary.emailSubmitAttempts).toBe(2);
    expect(data.summary.sessionsStarted).toBe(4);
    expect(data.summary.gamesCompleted).toBe(1);
    expect(data.summary.emailsSubmitted).toBe(3);
    expect(data.summary.emailSubmitSuccessRate).toBe(0.5);
    expect(data.summary.conversionRate).toBe(0.75);
  });

  it("uses server table counts for Saturday dashboard totals when analytics is missing", async () => {
    const saturday = buildDateRange("2026-05-09", "2026-05-09");
    const data = await getAdminDashboardData(
      createSupabaseStub({
        events: [],
        sessions: [{ id: "session-1" }, { id: "session-2" }],
        scores: [{ session_id: "session-1", score: 80, created_at: "2026-05-09T14:00:00.000Z" }],
        emails: [
          {
            session_id: "session-1",
            display_name: "Saturday Player",
            created_at: "2026-05-09T14:05:00.000Z",
          },
        ],
      }) as never,
      saturday
    );

    expect(saturday.fromIso).toBe("2026-05-09T04:00:00.000Z");
    expect(saturday.toIsoExclusive).toBe("2026-05-10T04:00:00.000Z");
    expect(data.summary.sessionsStarted).toBe(2);
    expect(data.summary.gamesCompleted).toBe(1);
    expect(data.summary.emailsSubmitted).toBe(1);
    expect(data.screenViews).toEqual([]);
    expect(data.buttonClicks).toEqual([]);
    expect(data.funnel).toEqual([]);
  });

  it("applies the date range to event and email queries and groups event views by type", async () => {
    const range = buildDateRange("2026-05-09", "2026-05-10");
    const { supabase, filters } = createRecordingSupabaseStub({
      events: [
        {
          session_id: "session-1",
          event_name: "landing_view",
          event_type: "screen_view",
          metadata: {},
          created_at: "2026-05-09T12:00:00.000Z",
        },
        {
          session_id: "session-1",
          event_name: "landing_view",
          event_type: "screen_view",
          metadata: {},
          created_at: "2026-05-09T12:01:00.000Z",
        },
        {
          session_id: "session-1",
          event_name: "start_game_click",
          event_type: "button_click",
          metadata: {},
          created_at: "2026-05-09T12:02:00.000Z",
        },
        {
          session_id: "session-1",
          event_name: "session_start_success",
          event_type: "funnel",
          metadata: {},
          created_at: "2026-05-09T12:03:00.000Z",
        },
      ],
      sessions: [
        {
          id: "session-1",
          started_at: "2026-05-09T12:00:00.000Z",
        },
      ],
      emails: [
        {
          session_id: "session-1",
          display_name: "Player",
          created_at: "2026-05-09T12:04:00.000Z",
        },
      ],
      scores: [
        {
          session_id: "session-1",
          score: 100,
          created_at: "2026-05-09T12:05:00.000Z",
        },
      ],
    });

    const data = await getAdminDashboardData(supabase as never, range);

    expect(filters).toEqual([
      { table: "analytics_events", op: "gte", column: "created_at", value: range.fromIso },
      { table: "analytics_events", op: "lt", column: "created_at", value: range.toIsoExclusive },
      { table: "sessions", op: "gte", column: "started_at", value: range.fromIso },
      { table: "sessions", op: "lt", column: "started_at", value: range.toIsoExclusive },
      { table: "scores", op: "gte", column: "created_at", value: range.fromIso },
      { table: "scores", op: "lt", column: "created_at", value: range.toIsoExclusive },
      { table: "emails", op: "gte", column: "created_at", value: range.fromIso },
      { table: "emails", op: "lt", column: "created_at", value: range.toIsoExclusive },
      { table: "emails", op: "gte", column: "created_at", value: range.fromIso },
      { table: "emails", op: "lt", column: "created_at", value: range.toIsoExclusive },
    ]);
    expect(data.screenViews).toEqual([{ name: "landing_view", count: 2 }]);
    expect(data.buttonClicks).toEqual([{ name: "start_game_click", count: 1 }]);
    expect(data.funnel).toEqual([{ name: "session_start_success", count: 1 }]);
    expect(data.recentEvents).toHaveLength(4);
  });
});
