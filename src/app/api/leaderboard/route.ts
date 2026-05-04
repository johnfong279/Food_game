import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { verifyToken, hashToken } from "@/lib/hmac";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionToken = url.searchParams.get("sessionToken");

  const supabase = createServerClient();

  const { data: top10, error } = await supabase
    .from("scores")
    .select("score, created_at, session_id")
    .order("score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(10);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }

  const sessionIds = (top10 ?? [])
    .map((row) => row.session_id)
    .filter((sessionId): sessionId is string => Boolean(sessionId));

  const { data: emailRows } = sessionIds.length > 0
    ? await supabase
        .from("emails")
        .select("session_id, display_name")
        .in("session_id", sessionIds)
    : { data: [] };

  const nameBySessionId = new Map(
    (emailRows ?? []).map((row) => [row.session_id, row.display_name] as const)
  );

  const entries = (top10 ?? []).map((row, i) => ({
    rank: i + 1,
    name: nameBySessionId.get(row.session_id) || `Player ${String(i + 1).padStart(2, "0")}`,
    score: row.score,
    createdAt: row.created_at,
  }));

  let yourRank: number | null = null;

  if (sessionToken) {
    const sessionId = verifyToken(sessionToken);
    if (sessionId) {
      const tokenHash = hashToken(sessionToken);
      const { data: session } = await supabase
        .from("sessions")
        .select("id")
        .eq("token_hash", tokenHash)
        .single();

      if (session) {
        const { data: myScore } = await supabase
          .from("scores")
          .select("score")
          .eq("session_id", session.id)
          .single();

        if (myScore) {
          const { count } = await supabase
            .from("scores")
            .select("id", { count: "exact", head: true })
            .gt("score", myScore.score);
          yourRank = (count ?? 0) + 1;
        }
      }
    }
  }

  return NextResponse.json(
    { top10: entries, yourRank },
    {
      headers: {
        "Cache-Control": "s-maxage=10, stale-while-revalidate=30",
      },
    }
  );
}
