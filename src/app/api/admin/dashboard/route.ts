import { NextResponse } from "next/server";
import { isAdminRequest, unauthorizedAdminResponse } from "@/lib/adminAuth";
import {
  getAdminDashboardData,
  parseAdminDateRange,
} from "@/lib/adminDashboard";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

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

  try {
    const data = await getAdminDashboardData(createServerClient(), range);
    return NextResponse.json(data);
  } catch (error) {
    console.error("admin dashboard error", error);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
