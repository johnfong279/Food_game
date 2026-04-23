import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization") ?? "";
  const base64 = authHeader.replace("Basic ", "");
  const decoded = Buffer.from(base64, "base64").toString("utf8");
  const [, password] = decoded.split(":");

  const adminHash = process.env.ADMIN_PASSWORD_HASH ?? "";
  const valid = password ? await bcrypt.compare(password, adminHash) : false;

  if (!valid) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
    });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("emails")
    .select("email, consent, rank_at_submit, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to export" }, { status: 500 });
  }

  const rows = (data ?? []).map(
    (r) => `${r.email},${r.consent},${r.rank_at_submit},${r.created_at}`
  );
  const csv = ["email,consent,rank_at_submit,created_at", ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="emails.csv"',
    },
  });
}
