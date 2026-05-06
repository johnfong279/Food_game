import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { signToken, hashToken } from "@/lib/hmac";
import { isGameClosed } from "@/lib/contest";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (isGameClosed()) {
    return NextResponse.json({ error: "Game closed" }, { status: 403 });
  }

  const sessionId = randomUUID();
  const sessionToken = signToken(sessionId);
  const tokenHash = hashToken(sessionToken);

  const ipHeader = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "";
  const ipHash = ipHeader ? hashToken(ipHeader.split(",")[0].trim()) : null;
  const userAgent = req.headers.get("user-agent") ?? null;

  const supabase = createServerClient();
  const { error } = await supabase.from("sessions").insert({
    token_hash: tokenHash,
    ip_hash: ipHash,
    user_agent: userAgent,
  });

  if (error) {
    console.error("session insert error", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }

  return NextResponse.json({ sessionToken, serverTime: Date.now() });
}
