import type { SupabaseClient } from "@supabase/supabase-js";

export interface EligibleLeaderboardEntry {
  sessionId: string;
  name: string | null;
  score: number;
  createdAt: string;
}

interface EmailRow {
  session_id: string | null;
  display_name: string | null;
}

interface ScoreRow {
  session_id: string | null;
  score: number;
  created_at: string;
}

export function sortLeaderboardEntries(entries: EligibleLeaderboardEntry[]) {
  return [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

export async function getEmailQualifiedLeaderboardEntries(supabase: SupabaseClient) {
  const { data: emails, error: emailsError } = await supabase
    .from("emails")
    .select("session_id, display_name");

  if (emailsError) {
    return { entries: [], error: emailsError };
  }

  const emailRows = (emails ?? []) as EmailRow[];
  const sessionIds = Array.from(
    new Set(
      emailRows
        .map((row) => row.session_id)
        .filter((sessionId): sessionId is string => Boolean(sessionId))
    )
  );

  if (sessionIds.length === 0) {
    return { entries: [], error: null };
  }

  const { data: scores, error: scoresError } = await supabase
    .from("scores")
    .select("session_id, score, created_at")
    .in("session_id", sessionIds);

  if (scoresError) {
    return { entries: [], error: scoresError };
  }

  const scoreBySessionId = new Map(
    ((scores ?? []) as ScoreRow[])
      .filter((row): row is ScoreRow & { session_id: string } => Boolean(row.session_id))
      .map((row) => [row.session_id, row] as const)
  );

  const entries = emailRows.flatMap((emailRow): EligibleLeaderboardEntry[] => {
    if (!emailRow.session_id) return [];
    const scoreRow = scoreBySessionId.get(emailRow.session_id);
    if (!scoreRow) return [];

    return [
      {
        sessionId: emailRow.session_id,
        name: emailRow.display_name,
        score: scoreRow.score,
        createdAt: scoreRow.created_at,
      },
    ];
  });

  return { entries: sortLeaderboardEntries(entries), error: null };
}

export function getLeaderboardRank(
  entries: EligibleLeaderboardEntry[],
  sessionId: string
) {
  const index = sortLeaderboardEntries(entries).findIndex((entry) => entry.sessionId === sessionId);
  return index >= 0 ? index + 1 : null;
}
