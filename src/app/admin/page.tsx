export default function AdminPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 bg-sakura-50">
      <h1 className="text-2xl font-bold text-sakura-700">Admin Dashboard</h1>
      <p className="text-sakura-500 text-sm">
        Download the full email list as CSV (requires admin credentials).
      </p>
      <a
        href="/api/admin/export"
        className="bg-sakura-500 text-white font-semibold px-6 py-3 rounded-full hover:bg-sakura-600 transition-colors"
      >
        ⬇ Export Emails CSV
      </a>
    </main>
  );
}
