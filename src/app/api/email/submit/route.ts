import { NextResponse } from "next/server";
import { verifyToken, hashToken } from "@/lib/hmac";
import { submitGameFormToHubSpot } from "@/lib/hubspot";
import {
  getEmailQualifiedLeaderboardEntries,
  getLeaderboardRank,
} from "@/lib/leaderboard";
import { createServerClient } from "@/lib/supabase/server";
import { EmailSubmitRequestSchema } from "@/schemas/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = EmailSubmitRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  const { sessionToken, displayName, email, honeypot } = parsed.data;

  if (honeypot && honeypot.length > 0) {
    return NextResponse.json({ success: true });
  }

  const sessionId = verifyToken(sessionToken);
  if (!sessionId) {
    return NextResponse.json({ error: "Invalid session token" }, { status: 401 });
  }

  const tokenHash = hashToken(sessionToken);
  const supabase = createServerClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("id")
    .eq("token_hash", tokenHash)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 401 });
  }

  const { data: myScore } = await supabase
    .from("scores")
    .select("score, created_at")
    .eq("session_id", session.id)
    .single();

  if (!myScore) {
    return NextResponse.json({ error: "No score found for session" }, { status: 400 });
  }

  const { entries: existingQualifiedEntries, error: leaderboardError } =
    await getEmailQualifiedLeaderboardEntries(supabase);

  if (leaderboardError) {
    return NextResponse.json({ error: "Failed to calculate rank" }, { status: 500 });
  }

  const rank =
    getLeaderboardRank(
      [
        ...existingQualifiedEntries.filter((entry) => entry.sessionId !== session.id),
        {
          sessionId: session.id,
          name: displayName,
          score: myScore.score,
          createdAt: myScore.created_at,
        },
      ],
      session.id
    ) ?? 1;

  const { error: insertErr } = await supabase.from("emails").insert({
    session_id: session.id,
    display_name: displayName,
    email: email.toLowerCase(),
    consent: true,
    rank_at_submit: rank,
    score_at_submit: myScore.score,
  });

  if (insertErr) {
    if (insertErr.code === "23505") {
      return NextResponse.json(
        { error: "Each email can be used one time." },
        { status: 409 }
      );
    }
    console.error("email insert error", insertErr);
    return NextResponse.json({ error: "Failed to save email" }, { status: 500 });
  }

  try {
    const origin = req.headers.get("origin");
    await submitGameFormToHubSpot({
      displayName,
      email,
      pageUri: origin ? `${origin}/` : undefined,
    });
  } catch (error) {
    console.error("hubspot form submit error", error);
  }

  return NextResponse.json({ success: true });
}
