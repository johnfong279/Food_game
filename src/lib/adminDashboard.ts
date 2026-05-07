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

export function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getDefaultAdminDateRange(now = new Date()): AdminDateRange {
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const from = new Date(to);
  from.setUTCDate(to.getUTCDate() - 6);
  return buildDateRange(formatDateInput(from), formatDateInput(to));
}

export function buildDateRange(from: string, to: string): AdminDateRange {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    throw new Error("Dates must use YYYY-MM-DD format");
  }

  const fromDate = new Date(`${from}T00:00:00.000Z`);
  const toDate = new Date(`${to}T00:00:00.000Z`);

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    throw new Error("Invalid date range");
  }

  if (fromDate > toDate) {
    throw new Error("From date must be before or equal to to date");
  }

  const toExclusive = new Date(toDate);
  toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);

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

export async function getAdminDashboardData(supabase: SupabaseClient, range: AdminDateRange) {
  const { data: events, error: eventsError } = await supabase
    .from("analytics_events")
    .select("session_id, event_name, event_type, metadata, created_at")
    .gte("created_at", range.fromIso)
    .lt("created_at", range.toIsoExclusive)
    .order("created_at", { ascending: false });

  if (eventsError) throw eventsError;

  const eventRows = (events ?? []) as AnalyticsRow[];
  const sessionsStarted = getCount(eventRows, "session_start_success");
  const gamesCompleted = getCount(eventRows, "game_completed");
  const emailsSubmitted = getCount(eventRows, "email_submit_success");

  return {
    range,
    summary: {
      sessionsStarted,
      gamesCompleted,
      emailsSubmitted,
      conversionRate: sessionsStarted > 0 ? emailsSubmitted / sessionsStarted : 0,
    },
    leaderboard: await getLeaderboardForRange(supabase, range),
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
