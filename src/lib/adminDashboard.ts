import type { SupabaseClient } from "@supabase/supabase-js";

interface AnalyticsRow {
  session_id: string | null;
  event_name: string;
  event_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface EmailRow {
  session_id: string | null;
  display_name: string | null;
  created_at: string;
}

interface ScoreRow {
  session_id: string | null;
  score: number;
  created_at: string;
}

export interface AdminDateRange {
  from: string;
  to: string;
  fromIso: string;
  toIsoExclusive: string;
}

export const ADMIN_TIME_ZONE = "America/Toronto";

export function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDateInTimeZone(date: Date, timeZone = ADMIN_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function getTimeZoneOffsetMs(date: Date, timeZone = ADMIN_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );

  return asUtc - date.getTime();
}

function zonedDateStartToUtc(dateInput: string, timeZone = ADMIN_TIME_ZONE) {
  const utcMidnight = new Date(`${dateInput}T00:00:00.000Z`);
  const firstPass = new Date(utcMidnight.getTime() - getTimeZoneOffsetMs(utcMidnight, timeZone));
  return new Date(utcMidnight.getTime() - getTimeZoneOffsetMs(firstPass, timeZone));
}

function addDays(dateInput: string, days: number) {
  const date = new Date(`${dateInput}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateInput(date);
}

function assertValidDateInput(dateInput: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    throw new Error("Dates must use YYYY-MM-DD format");
  }

  const date = new Date(`${dateInput}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || formatDateInput(date) !== dateInput) {
    throw new Error("Invalid date range");
  }
}

export function getDefaultAdminDateRange(now = new Date()): AdminDateRange {
  const to = formatDateInTimeZone(now);
  const from = addDays(to, -6);
  return buildDateRange(from, to);
}

export function buildDateRange(from: string, to: string): AdminDateRange {
  assertValidDateInput(from);
  assertValidDateInput(to);

  const fromDate = zonedDateStartToUtc(from);
  const toDate = zonedDateStartToUtc(to);

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    throw new Error("Invalid date range");
  }

  if (fromDate > toDate) {
    throw new Error("From date must be before or equal to to date");
  }

  const toExclusive = zonedDateStartToUtc(addDays(to, 1));

  return {
    from,
    to,
    fromIso: fromDate.toISOString(),
    toIsoExclusive: toExclusive.toISOString(),
  };
}

export function parseAdminDateRange(searchParams: URLSearchParams, now = new Date()) {
  const defaults = getDefaultAdminDateRange(now);
  return buildDateRange(
    searchParams.get("from") || defaults.from,
    searchParams.get("to") || defaults.to
  );
}

function countByName(events: AnalyticsRow[], eventType?: string) {
  const counts = new Map<string, number>();
  for (const event of events) {
    if (eventType && event.event_type !== eventType) continue;
    counts.set(event.event_name, (counts.get(event.event_name) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function getCount(events: AnalyticsRow[], name: string) {
  return events.filter((event) => event.event_name === name).length;
}

async function getLeaderboardForRange(supabase: SupabaseClient, range: AdminDateRange) {
  const { data: emails, error: emailsError } = await supabase
    .from("emails")
    .select("session_id, display_name, created_at")
    .gte("created_at", range.fromIso)
    .lt("created_at", range.toIsoExclusive);

  if (emailsError) throw emailsError;

  const emailRows = (emails ?? []) as EmailRow[];
  const sessionIds = Array.from(
    new Set(
      emailRows
        .map((row) => row.session_id)
        .filter((sessionId): sessionId is string => Boolean(sessionId))
    )
  );

  if (sessionIds.length === 0) return [];

  const { data: scores, error: scoresError } = await supabase
    .from("scores")
    .select("session_id, score, created_at")
    .in("session_id", sessionIds);

  if (scoresError) throw scoresError;

  const scoreBySessionId = new Map(
    ((scores ?? []) as ScoreRow[])
      .filter((row): row is ScoreRow & { session_id: string } => Boolean(row.session_id))
      .map((row) => [row.session_id, row] as const)
  );

  return emailRows
    .flatMap((emailRow) => {
      if (!emailRow.session_id) return [];
      const scoreRow = scoreBySessionId.get(emailRow.session_id);
      if (!scoreRow) return [];
      return [{
        sessionId: emailRow.session_id,
        name: emailRow.display_name || "Player",
        score: scoreRow.score,
        createdAt: scoreRow.created_at,
        emailSubmittedAt: emailRow.created_at,
      }];
    })
    .sort((a, b) => b.score - a.score || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

async function getTableCountForRange(
  supabase: SupabaseClient,
  table: "sessions" | "scores" | "emails",
  column: "started_at" | "created_at",
  range: AdminDateRange
) {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .gte(column, range.fromIso)
    .lt(column, range.toIsoExclusive);

  if (error) throw error;

  return count ?? 0;
}

export async function getAdminDashboardData(supabase: SupabaseClient, range: AdminDateRange) {
  const { data: events, error: eventsError } = await supabase
    .from("analytics_events")
    .select("session_id, event_name, event_type, metadata, created_at")
    .gte("created_at", range.fromIso)
    .lt("created_at", range.toIsoExclusive)
    .order("created_at", { ascending: false });

  if (eventsError) throw eventsError;

  const eventRows = (events ?? []) as AnalyticsRow[];
  const emailSubmitAttempts = getCount(eventRows, "email_submit_attempt");
  const emailSubmitSuccessEvents = getCount(eventRows, "email_submit_success");
  const [sessionsStarted, gamesCompleted, emailsSubmitted, leaderboard] = await Promise.all([
    getTableCountForRange(supabase, "sessions", "started_at", range),
    getTableCountForRange(supabase, "scores", "created_at", range),
    getTableCountForRange(supabase, "emails", "created_at", range),
    getLeaderboardForRange(supabase, range),
  ]);

  return {
    range,
    summary: {
      sessionsStarted,
      gamesCompleted,
      emailSubmitAttempts,
      emailsSubmitted,
      conversionRate: sessionsStarted > 0 ? emailsSubmitted / sessionsStarted : 0,
      emailSubmitSuccessRate: emailSubmitAttempts > 0 ? emailSubmitSuccessEvents / emailSubmitAttempts : 0,
    },
    leaderboard,
    buttonClicks: countByName(eventRows, "button_click"),
    screenViews: countByName(eventRows, "screen_view"),
    funnel: countByName(eventRows, "funnel"),
    recentEvents: eventRows.slice(0, 25).map((event) => ({
      sessionId: event.session_id,
      eventName: event.event_name,
      eventType: event.event_type,
      metadata: event.metadata,
      createdAt: event.created_at,
    })),
  };
}
