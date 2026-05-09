import { NextResponse } from "next/server";
import { isAdminRequest, unauthorizedAdminResponse } from "@/lib/adminAuth";
import { parseAdminDateRange } from "@/lib/adminDashboard";
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

  const url = new URL(req.url);
  let range;
  try {
    range = parseAdminDateRange(url.searchParams);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid date range" },
      { status: 400 }
    );
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("emails")
    .select("display_name, email, consent, rank_at_submit, score_at_submit, created_at")
    .gte("created_at", range.fromIso)
    .lt("created_at", range.toIsoExclusive)
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
      "Content-Disposition": `attachment; filename="emails-${range.from}-to-${range.to}.csv"`,
    },
  });
}
