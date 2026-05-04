import Link from "next/link";

export default function TermsPage() {
  return (
    <main
      className="min-h-dvh bg-sakura-100 px-6 py-10 text-gray-800"
      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      <div className="mx-auto flex min-h-[calc(100dvh-5rem)] max-w-2xl flex-col">
        <Link
          href="/"
          className="mb-8 inline-flex w-fit items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-semibold text-sakura-600 shadow-sm transition hover:bg-sakura-50 focus:outline-none focus:ring-2 focus:ring-sakura-300"
        >
          Back to Entry
        </Link>

        <section className="space-y-5 rounded-lg bg-white/70 p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-sakura-600">Terms &amp; Conditions</h1>
          <p>
            This is a dummy Terms &amp; Conditions page for Sakura Snack. Replace
            this content with the final campaign, privacy, eligibility, and prize
            details before launch.
          </p>
          <p>
            By playing the game, users may be asked to submit basic information
            such as their email address for leaderboard or reward purposes.
          </p>
          <p>
            Scores may be reviewed for fairness and invalid entries may be
            removed. This placeholder text is not legal advice.
          </p>
        </section>
      </div>
    </main>
  );
}
