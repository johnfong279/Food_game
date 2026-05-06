import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { verifyToken, hashToken } from "@/lib/hmac";
import {
  getEmailQualifiedLeaderboardEntries,
  getLeaderboardRank,
} from "@/lib/leaderboard";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionToken = url.searchParams.get("sessionToken");

  const supabase = createServerClient();

  const { entries: qualifiedEntries, error } = await getEmailQualifiedLeaderboardEntries(supabase);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }

  const entries = qualifiedEntries.slice(0, 10).map((row, i) => ({
    rank: i + 1,
    name: row.name || `Player ${String(i + 1).padStart(2, "0")}`,
    score: row.score,
    createdAt: row.createdAt,
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
        yourRank = getLeaderboardRank(qualifiedEntries, session.id);
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
