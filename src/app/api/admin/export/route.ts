import { NextResponse } from "next/server";
import { isAdminRequest, unauthorizedAdminResponse } from "@/lib/adminAuth";
import {
  getAnalyticsEventsForRange,
  parseAdminDateRange,
} from "@/lib/adminDashboard";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface EmailExportRow {
  session_id: string | null;
  display_name: string | null;
  email: string;
  consent: boolean;
  score_at_submit: number | null;
  created_at: string;
}

interface ScoreRow {
  session_id: string | null;
  score: number;
  created_at: string;
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

async function exportAnalyticsCsv(range: ReturnType<typeof parseAdminDateRange>) {
  const supabase = createServerClient();
  const events = await getAnalyticsEventsForRange(supabase, range);
  const rows = events.map((event) =>
    [
      event.created_at,
      event.event_name,
      event.event_type,
      event.session_id,
      JSON.stringify(event.metadata ?? {}),
    ].map(csvCell).join(",")
  );
  const csv = [
    "created_at,event_name,event_type,session_id,metadata",
    ...rows,
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="web-analysis-${range.from}-to-${range.to}.csv"`,
    },
  });
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

  if (url.searchParams.get("type") === "analytics") {
    try {
      return await exportAnalyticsCsv(range);
    } catch {
      return NextResponse.json({ error: "Failed to export" }, { status: 500 });
    }
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("emails")
    .select("session_id, display_name, email, consent, score_at_submit, created_at")
    .gte("created_at", range.fromIso)
    .lt("created_at", range.toIsoExclusive)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to export" }, { status: 500 });
  }

  const emailRows = (data ?? []) as EmailExportRow[];
  const sessionIds = Array.from(
    new Set(
      emailRows
        .map((row) => row.session_id)
        .filter((sessionId): sessionId is string => Boolean(sessionId))
    )
  );

  let rankBySessionId = new Map<string, number>();
  if (sessionIds.length > 0) {
    const { data: scores, error: scoresError } = await supabase
      .from("scores")
      .select("session_id, score, created_at")
      .in("session_id", sessionIds);

    if (scoresError) {
      return NextResponse.json({ error: "Failed to export" }, { status: 500 });
    }

    rankBySessionId = new Map(
      ((scores ?? []) as ScoreRow[])
        .filter((row): row is ScoreRow & { session_id: string } => Boolean(row.session_id))
        .sort((a, b) => b.score - a.score || new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((row, index) => [row.session_id, index + 1] as const)
    );
  }

  const rows = emailRows.map((r) =>
    [r.display_name, r.email, r.consent, r.session_id ? rankBySessionId.get(r.session_id) : null, r.score_at_submit, r.created_at]
      .map(csvCell)
      .join(",")
  );
  const csv = [
    "display_name,email,consent,rank_at_export,score_at_submit,created_at",
    ...rows,
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="emails-${range.from}-to-${range.to}.csv"`,
    },
  });
}
