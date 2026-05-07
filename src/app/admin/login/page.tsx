interface AdminLoginPageProps {
  searchParams?: {
    next?: string;
    error?: string;
  };
}

export default function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const next = searchParams?.next?.startsWith("/admin") ? searchParams.next : "/admin";

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-sakura-50 px-6 py-10 text-[#4D2809]"
      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      <form
        action="/api/admin/login"
        method="post"
        className="flex w-full max-w-sm flex-col gap-5 rounded-lg bg-white p-6 shadow-sm"
      >
        <input type="hidden" name="next" value={next} />
        <div>
          <h1 className="text-2xl font-black text-sakura-700">Admin Login</h1>
          <p className="mt-2 text-sm font-semibold text-sakura-500">
            Enter the admin password to view the dashboard.
          </p>
        </div>

        {searchParams?.error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            Invalid admin password.
          </div>
        )}

        <label className="flex flex-col gap-2 text-sm font-bold text-sakura-700">
          Password
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className="rounded-md border border-sakura-200 px-4 py-3 text-[#4D2809] outline-none focus:border-sakura-400"
          />
        </label>

        <button className="rounded-md bg-sakura-500 px-4 py-3 text-sm font-bold text-white hover:bg-sakura-600">
          Log in
        </button>
      </form>
    </main>
  );
}
