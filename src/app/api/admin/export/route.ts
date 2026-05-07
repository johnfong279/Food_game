import { NextResponse } from "next/server";
import { isAdminRequest, unauthorizedAdminResponse } from "@/lib/adminAuth";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(req: Request) {
  if (!await isAdminRequest(req)) {
    return unauthorizedAdminResponse();
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("emails")
    .select("display_name, email, consent, rank_at_submit, score_at_submit, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to export" }, { status: 500 });
  }

  const rows = (data ?? []).map((r) =>
    [r.display_name, r.email, r.consent, r.rank_at_submit, r.score_at_submit, r.created_at]
      .map(csvCell)
      .join(",")
  );
  const csv = [
    "display_name,email,consent,rank_at_submit,score_at_submit,created_at",
    ...rows,
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="emails.csv"',
    },
  });
}
