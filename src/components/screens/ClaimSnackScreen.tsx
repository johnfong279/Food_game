"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { TermsContent } from "@/components/TermsContent";
import { ValidEmailScreen } from "@/components/screens/ValidEmailScreen";
import { useGameStore } from "@/store/gameStore";

export function ClaimSnackScreen() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [termsConsent, setTermsConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [termsModalOpen, setTermsModalOpen] = useState(false);

  const sessionToken = useGameStore((s) => s.sessionToken);
  const discountCode = useGameStore((s) => s.discountCode) ?? "SAKURA2026";
  const setScreen = useGameStore((s) => s.setScreen);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!sessionToken) {
      setError("Game session missing. Please play again before claiming your snack.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/email/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          displayName,
          email,
          consent: marketingConsent,
          honeypot,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message = data?.error ?? "Submission failed";
        if (res.status === 409) {
          setModalMessage(message);
          return;
        }
        throw new Error(message);
      }
      setSubmitted(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      className="relative flex h-full w-full flex-col items-center overflow-hidden px-8 py-6 text-center"
      style={{
        backgroundImage: "url('/assets/backgrounds/end-screen.png')",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      {error && (
        <div
          role="alert"
          className="absolute left-6 right-6 top-5 z-10 rounded-lg border-2 border-red-300 bg-white/95 px-4 py-3 text-xs font-bold leading-snug text-red-600 shadow-lg"
        >
          {error}
        </div>
      )}

      {modalMessage && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#4D2809]/35 px-8">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="claim-email-modal-title"
            className="w-full max-w-[280px] rounded-xl border-2 border-sakura-300 bg-white/95 px-5 py-6 text-center shadow-xl"
          >
            <h2 id="claim-email-modal-title" className="text-sm font-black text-sakura-600">
              Email already used
            </h2>
            <p className="mt-3 text-xs font-bold leading-relaxed text-[#4D2809]">
              {modalMessage}
            </p>
            <button
              type="button"
              onClick={() => setModalMessage(null)}
              className="pixel-button mt-5 w-full px-4 py-3 text-xs"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {termsModalOpen && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#4D2809]/45 px-5 py-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="terms-modal-title"
            className="relative flex h-full max-h-[620px] w-full max-w-[350px] flex-col rounded-lg border-2 border-sakura-300 bg-white/95 text-left text-[#4D2809] shadow-xl"
          >
            <button
              type="button"
              aria-label="Close terms modal"
              onClick={() => setTermsModalOpen(false)}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-sakura-300 bg-white p-0 text-lg font-black leading-none text-sakura-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-sakura-300"
              style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
            >
              X
            </button>
            <div
              className="overflow-y-auto px-5 pb-5 pt-14 text-[0.72rem] leading-relaxed"
              style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
            >
              <div id="terms-modal-title" className="sr-only">
                Terms &amp; Conditions
              </div>
              <TermsContent />
            </div>
          </div>
        </div>
      )}

      <div
        className={`mt-2 flex flex-1 flex-col items-center gap-4 ${
          submitted ? "justify-center" : "justify-start"
        }`}
      >
        {submitted ? (
          <ValidEmailScreen
            discountCode={discountCode}
            onLeaderboard={() => setScreen("leaderboard")}
          />
        ) : (
          <>
            <Image
              src="/assets/ui/gift-pixel-transparent.png"
              alt="Gift"
              width={240}
              height={240}
              className="h-36 w-36 object-contain"
              priority
            />

            <div className="space-y-3 text-center">
              <p className="text-[0.86rem] font-bold leading-relaxed text-[#4D2809]">
                Enter your email
                <br />
                to claim your
                <br />
                <br />
                <span className="text-[1.05rem] text-sakura-600">FREE POTATO STICKS!</span>
                <br />
                <span className="text-[0.78rem] text-sakura-600">
                  🎁 Top 3 players win $30 credits!
                </span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex w-full max-w-[310px] flex-col gap-4">
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="hidden"
              />

              <input
                type="text"
                required
                minLength={1}
                maxLength={16}
                placeholder="your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-14 rounded-md border-2 border-sakura-200 bg-white/90 px-4 text-center text-xs font-bold text-sakura-700 outline-none placeholder:text-sakura-300 focus:border-sakura-400"
              />

              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 rounded-md border-2 border-sakura-200 bg-white/90 px-4 text-center text-xs font-bold text-sakura-700 outline-none placeholder:text-sakura-300 focus:border-sakura-400"
              />

              <div className="flex items-start gap-2 whitespace-nowrap text-left text-[0.5rem] font-bold leading-tight text-[#4D2809]">
                <label className="flex cursor-pointer items-start gap-2">
                  <input
                    type="checkbox"
                    required
                    aria-label="I agree to the Terms & Conditions"
                    checked={termsConsent}
                    onChange={(e) => setTermsConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-sakura-500"
                  />
                  <span>I agree to the</span>
                </label>
                <button
                  type="button"
                  onClick={() => setTermsModalOpen(true)}
                  className="font-bold text-sakura-600 underline underline-offset-2"
                >
                  Terms &amp; Conditions
                </button>
              </div>

              <label className="flex cursor-pointer items-start gap-2 whitespace-nowrap text-left text-[0.5rem] font-bold leading-tight text-[#4D2809]">
                <input
                  type="checkbox"
                  required
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-sakura-500"
                />
                <span>I agree to receive marketing emails</span>
              </label>

              <motion.button
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={submitting}
                className="pixel-button w-full px-4 py-4 text-sm"
              >
                {submitting ? "Checking..." : "GET MY SNACK"}
              </motion.button>
            </form>
          </>
        )}
      </div>
    </motion.div>
  );
}
