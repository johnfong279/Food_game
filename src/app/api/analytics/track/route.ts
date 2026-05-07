import { NextResponse } from "next/server";
import { verifyToken, hashToken } from "@/lib/hmac";
import { createServerClient } from "@/lib/supabase/server";
import { AnalyticsTrackRequestSchema } from "@/schemas/analytics";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = AnalyticsTrackRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  const { eventName, eventType, sessionToken, metadata } = parsed.data;
  const supabase = createServerClient();
  let sessionId: string | null = null;

  if (sessionToken && verifyToken(sessionToken)) {
    const tokenHash = hashToken(sessionToken);
    const { data: session } = await supabase
      .from("sessions")
      .select("id")
      .eq("token_hash", tokenHash)
      .single();
    sessionId = session?.id ?? null;
  }

  const { error } = await supabase.from("analytics_events").insert({
    session_id: sessionId,
    event_name: eventName,
    event_type: eventType,
    metadata,
  });

  if (error) {
    console.error("analytics insert error", error);
    return NextResponse.json({ error: "Failed to track event" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
