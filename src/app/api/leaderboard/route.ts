import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { verifyToken, hashToken } from "@/lib/hmac";
import {
  type EligibleLeaderboardEntry,
  getEmailQualifiedLeaderboardEntries,
  getLeaderboardRank,
} from "@/lib/leaderboard";

export const runtime = "nodejs";

function toLeaderboardEntry(row: EligibleLeaderboardEntry, rank: number) {
  return {
    rank,
    name: row.name || `Player ${String(rank).padStart(2, "0")}`,
    score: row.score,
    createdAt: row.createdAt,
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionToken = url.searchParams.get("sessionToken");

  const supabase = createServerClient();

  const { entries: qualifiedEntries, error } = await getEmailQualifiedLeaderboardEntries(supabase);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }

  const entries = qualifiedEntries.slice(0, 10).map((row, i) => toLeaderboardEntry(row, i + 1));

  let yourRank: number | null = null;
  let yourEntry: ReturnType<typeof toLeaderboardEntry> | null = null;

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
        yourRank = getLeaderboardRank(qualifiedEntries, session.id);
        const ownIndex = qualifiedEntries.findIndex((entry) => entry.sessionId === session.id);
        if (ownIndex >= 0) {
          yourEntry = toLeaderboardEntry(qualifiedEntries[ownIndex], ownIndex + 1);
        }
      }
    }
  }

  return NextResponse.json(
    { top10: entries, yourRank, yourEntry },
    {
      headers: {
        "Cache-Control": "s-maxage=10, stale-while-revalidate=30",
      },
    }
  );
}
