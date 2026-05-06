import Link from "next/link";
import { TermsContent } from "@/components/TermsContent";

interface TermsPageProps {
  searchParams?: {
    from?: string;
  };
}

export default function TermsPage({ searchParams }: TermsPageProps) {
  const backHref = searchParams?.from === "claimSnack" ? "/?screen=claimSnack" : "/";
  const backLabel = searchParams?.from === "claimSnack" ? "Back to Claim" : "Back to Entry";

  return (
    <main
      className="min-h-dvh bg-sakura-100 px-6 py-10 text-gray-800"
      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
    >
      <div className="mx-auto flex min-h-[calc(100dvh-5rem)] max-w-2xl flex-col">
        <Link
          href={backHref}
          className="mb-8 inline-flex w-fit items-center justify-center rounded-md bg-white px-5 py-3 text-sm font-semibold text-sakura-600 shadow-sm transition hover:bg-sakura-50 focus:outline-none focus:ring-2 focus:ring-sakura-300"
        >
          {backLabel}
        </Link>

        <section className="space-y-5 rounded-lg bg-white/70 p-6 shadow-sm">
          <TermsContent />
        </section>
      </div>
    </main>
  );
}
