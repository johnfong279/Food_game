import { NextResponse } from "next/server";
import { verifyToken, hashToken } from "@/lib/hmac";
import { createServerClient } from "@/lib/supabase/server";
import { EmailSubmitRequestSchema } from "@/schemas/email";

export const runtime = "nodejs";

const TOP_RANK_THRESHOLD = 3;

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

  const { sessionToken, email, honeypot } = parsed.data;

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
    .select("score")
    .eq("session_id", session.id)
    .single();

  if (!myScore) {
    return NextResponse.json({ error: "No score found for session" }, { status: 400 });
  }

  const { count: aboveCount } = await supabase
    .from("scores")
    .select("id", { count: "exact", head: true })
    .gt("score", myScore.score);

  const rank = (aboveCount ?? 0) + 1;

  if (rank > TOP_RANK_THRESHOLD) {
    return NextResponse.json({ error: "Email submission reserved for top 3 players" }, { status: 403 });
  }

  const { error: insertErr } = await supabase.from("emails").insert({
    session_id: session.id,
    email: email.toLowerCase(),
    consent: true,
    rank_at_submit: rank,
  });

  if (insertErr) {
    if (insertErr.code === "23505") {
      return NextResponse.json({ success: true });
    }
    console.error("email insert error", insertErr);
    return NextResponse.json({ error: "Failed to save email" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
