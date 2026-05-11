import {
  ADMIN_TIME_ZONE,
  getAdminDashboardData,
  parseAdminDateRange,
} from "@/lib/adminDashboard";
import { createServerClient } from "@/lib/supabase/server";

interface AdminPageProps {
  searchParams?: {
    from?: string;
    to?: string;
  };
}

function formatPercent(value: number) {
  return `${Math.round(value * 1000) / 10}%`;
}

function compactMetadata(metadata: Record<string, unknown>) {
  const text = JSON.stringify(metadata);
  return text.length > 80 ? `${text.slice(0, 77)}...` : text;
}

function formatTorontoDateTime(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ADMIN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = new URLSearchParams();
  if (searchParams?.from) params.set("from", searchParams.from);
  if (searchParams?.to) params.set("to", searchParams.to);

  let data;
  let error: string | null = null;

  try {
    const range = parseAdminDateRange(params);
    data = await getAdminDashboardData(createServerClient(), range);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load dashboard";
    const fallbackRange = parseAdminDateRange(new URLSearchParams());
    data = await getAdminDashboardData(createServerClient(), fallbackRange);
  }

  const exportParams = new URLSearchParams({
    from: data.range.from,
    to: data.range.to,
  });
  const exportHref = `/api/admin/export?${exportParams.toString()}`;

  return (
    <main
      className="min-h-screen bg-sakura-50 px-6 py-8 text-[#4D2809]"
      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-lg bg-white p-5 shadow-sm md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-black text-sakura-700">Admin Dashboard</h1>
            <p className="mt-2 text-sm font-semibold text-sakura-500">
              Leaderboard and website behavior analytics. Dates use Toronto time.
            </p>
            <p className="mt-1 text-xs font-semibold text-sakura-400">
              Showing {data.range.from} 00:00 through {data.range.to} 23:59 ({ADMIN_TIME_ZONE}).
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <form className="flex flex-wrap items-end gap-3" action="/admin">
              <label className="flex flex-col gap-1 text-xs font-bold uppercase text-sakura-700">
                From
                <input
                  type="date"
                  name="from"
                  defaultValue={data.range.from}
                  className="rounded-md border border-sakura-200 px-3 py-2 text-sm text-[#4D2809]"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-bold uppercase text-sakura-700">
                To
                <input
                  type="date"
                  name="to"
                  defaultValue={data.range.to}
                  className="rounded-md border border-sakura-200 px-3 py-2 text-sm text-[#4D2809]"
                />
              </label>
              <button className="rounded-md bg-sakura-500 px-4 py-2 text-sm font-bold text-white hover:bg-sakura-600">
                Apply
              </button>
            </form>
            <a
              href={exportHref}
              className="rounded-md bg-white px-4 py-2 text-sm font-bold text-sakura-600 ring-1 ring-sakura-200 hover:bg-sakura-50"
            >
              Export CSV
            </a>
            <form action="/api/admin/logout" method="post">
              <button className="rounded-md bg-white px-4 py-2 text-sm font-bold text-[#4D2809] ring-1 ring-sakura-200 hover:bg-sakura-50">
                Log out
              </button>
            </form>
          </div>
        </header>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-5">
          {[
            ["Sessions Started", data.summary.sessionsStarted],
            ["Games Completed", data.summary.gamesCompleted],
            ["Email Attempts", data.summary.emailSubmitAttempts],
            ["Emails Submitted", data.summary.emailsSubmitted],
            ["Email Conversion", formatPercent(data.summary.conversionRate)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase text-sakura-500">{label}</p>
              <p className="mt-3 text-3xl font-black text-sakura-700">{value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-sakura-700">Leaderboard</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="text-xs uppercase text-sakura-500">
                  <tr>
                    <th className="py-2">Rank</th>
                    <th>Name</th>
                    <th>Score</th>
                    <th>Email Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sakura-100">
                  {data.leaderboard.length === 0 ? (
                    <tr><td className="py-5 text-sakura-500" colSpan={4}>No email-qualified scores in this range.</td></tr>
                  ) : data.leaderboard.map((entry) => (
                    <tr key={entry.sessionId}>
                      <td className="py-3 font-bold">{entry.rank}</td>
                      <td>{entry.name}</td>
                      <td>{entry.score}</td>
                      <td>{formatTorontoDateTime(entry.emailSubmittedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-sakura-700">Button Clicks</h2>
            <div className="mt-4 space-y-2">
              {data.buttonClicks.length === 0 ? (
                <p className="text-sm font-semibold text-sakura-500">No button clicks in this range.</p>
              ) : data.buttonClicks.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-md bg-sakura-50 px-3 py-2 text-sm">
                  <span className="font-bold">{item.name}</span>
                  <span>{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          {[
            ["Screen Views", data.screenViews],
            ["Funnel Events", data.funnel],
          ].map(([title, rows]) => (
            <div key={title as string} className="rounded-lg bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-sakura-700">{title as string}</h2>
              <div className="mt-4 space-y-2">
                {(rows as typeof data.screenViews).length === 0 ? (
                  <p className="text-sm font-semibold text-sakura-500">No events in this range.</p>
                ) : (rows as typeof data.screenViews).map((item) => (
                  <div key={item.name} className="flex items-center justify-between rounded-md bg-sakura-50 px-3 py-2 text-sm">
                    <span className="font-bold">{item.name}</span>
                    <span>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-lg bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-sakura-700">Recent Events</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase text-sakura-500">
                <tr>
                  <th className="py-2">Time</th>
                  <th>Event</th>
                  <th>Type</th>
                  <th>Session</th>
                  <th>Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sakura-100">
                {data.recentEvents.length === 0 ? (
                  <tr><td className="py-5 text-sakura-500" colSpan={5}>No recent events in this range.</td></tr>
                ) : data.recentEvents.map((event) => (
                  <tr key={`${event.createdAt}-${event.eventName}-${event.sessionId ?? "anon"}`}>
                    <td className="py-3">{formatTorontoDateTime(event.createdAt)}</td>
                    <td className="font-bold">{event.eventName}</td>
                    <td>{event.eventType}</td>
                    <td className="max-w-[160px] truncate">{event.sessionId ?? "anonymous"}</td>
                    <td className="max-w-[280px] truncate">{compactMetadata(event.metadata)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
