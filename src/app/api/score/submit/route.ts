import { NextResponse } from "next/server";
import { verifyToken, hashToken } from "@/lib/hmac";
import { rateLimit } from "@/lib/rateLimit";
import { isGameClosed } from "@/lib/contest";
import { createServerClient } from "@/lib/supabase/server";
import { ScoreSubmitRequestSchema } from "@/schemas/score";

export const runtime = "nodejs";

const MAX_POINTS_PER_SECOND = 125;
const SESSION_LIFETIME_MS = 90_000;

export async function POST(req: Request) {
  if (isGameClosed()) {
    return NextResponse.json({ error: "Game closed" }, { status: 403 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const { allowed } = await rateLimit(`score:${ip}`, 5, 60);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ScoreSubmitRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  const { sessionToken, score, petalsCaught, snacksCaught, durationMs, events } = parsed.data;

  const sessionId = verifyToken(sessionToken);
  if (!sessionId) {
    return NextResponse.json({ error: "Invalid session token" }, { status: 401 });
  }

  const tokenHash = hashToken(sessionToken);
  const supabase = createServerClient();

  const { data: session, error: sessErr } = await supabase
    .from("sessions")
    .select("id, started_at, ended_at")
    .eq("token_hash", tokenHash)
    .single();

  if (sessErr || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 401 });
  }

  if (session.ended_at) {
    return NextResponse.json({ error: "Session already submitted" }, { status: 409 });
  }

  const elapsed = Date.now() - new Date(session.started_at).getTime();
  if (elapsed > SESSION_LIFETIME_MS) {
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  const durationSec = durationMs / 1000;
  if (score > MAX_POINTS_PER_SECOND * durationSec) {
    return NextResponse.json({ error: "Score rejected: ceiling exceeded" }, { status: 422 });
  }

  const catchCount = events.filter((e) => e.type === "petal_catch" || e.type === "snack_catch").length;
  if (catchCount < petalsCaught + snacksCaught) {
    return NextResponse.json({ error: "Score rejected: event mismatch" }, { status: 422 });
  }

  const { error: scoreErr } = await supabase.from("scores").insert({
    session_id: session.id,
    score,
    petals_caught: petalsCaught,
    snacks_caught: snacksCaught,
    duration_ms: durationMs,
  });

  if (scoreErr) {
    console.error("score insert error", scoreErr);
    return NextResponse.json({ error: "Failed to save score" }, { status: 500 });
  }

  await supabase.from("sessions").update({ ended_at: new Date().toISOString() }).eq("id", session.id);

  const { count: aboveCount } = await supabase
    .from("scores")
    .select("id", { count: "exact", head: true })
    .gt("score", score);

  const { count: totalCount } = await supabase
    .from("scores")
    .select("id", { count: "exact", head: true });

  const rank = (aboveCount ?? 0) + 1;
  const totalPlayers = totalCount ?? 1;
  const discountCode = process.env.NEXT_PUBLIC_DISCOUNT_CODE ?? "SAKURA2026";

  return NextResponse.json({ rank, totalPlayers, discountCode });
}
