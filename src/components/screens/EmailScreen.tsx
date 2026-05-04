"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/store/gameStore";

export function EmailScreen() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionToken = useGameStore((s) => s.sessionToken);
  const rank = useGameStore((s) => s.rank);
  const setScreen = useGameStore((s) => s.setScreen);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/email/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken, displayName, email, consent, honeypot }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Submission failed");
      }
      setSubmitted(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center h-full p-6 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-5xl">✅</div>
        <h2 className="text-2xl font-bold text-sakura-700">You&apos;re in!</h2>
        <p className="text-sakura-500 text-center">We&apos;ll be in touch with your prize. 🎉</p>
        <button
          onClick={() => setScreen("leaderboard")}
          className="pixel-button mt-4 px-8 py-3 text-sm"
        >
          Leaderboard
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex flex-col items-center justify-center h-full p-6 gap-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <div className="text-4xl">🏆</div>
      <h2 className="text-2xl font-bold text-sakura-700">Claim Your Prize</h2>
      <p className="text-sakura-500 text-sm text-center">
        You ranked <strong>#{rank}</strong>! Enter your email to claim your exclusive reward.
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-xs flex flex-col gap-4">
        {/* honeypot — hidden from humans, traps bots */}
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
          className="border-2 border-sakura-200 rounded-xl px-4 py-3 outline-none focus:border-sakura-400 text-sakura-700"
        />

        <input
          type="email"
          required
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border-2 border-sakura-200 rounded-xl px-4 py-3 outline-none focus:border-sakura-400 text-sakura-700"
        />

        <label className="flex items-start gap-2 text-sm text-sakura-600 cursor-pointer">
          <input
            type="checkbox"
            required
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 accent-sakura-500"
          />
          I agree to receive marketing emails and the prize notification from Sakura Snack.
        </label>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <motion.button
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={submitting || !consent}
          className="pixel-button w-full px-4 py-3 text-sm"
        >
          {submitting ? "Submitting..." : "Submit"}
        </motion.button>
      </form>

      <button onClick={() => setScreen("end")} className="pixel-button pixel-button-small">
        Back
      </button>
    </motion.div>
  );
}
