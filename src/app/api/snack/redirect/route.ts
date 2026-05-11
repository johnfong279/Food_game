import { NextResponse } from "next/server";
import { verifyToken, hashToken } from "@/lib/hmac";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const SNACK_URL = "https://applewood-signature.com/";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionToken = url.searchParams.get("sessionToken");
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
    event_name: "external_snack_link_click",
    event_type: "button_click",
    metadata: { destination: SNACK_URL },
  });

  if (error) {
    console.error("external snack link analytics insert error", error);
  }

  return NextResponse.redirect(SNACK_URL, 302);
}
