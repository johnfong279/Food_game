"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useGameStore } from "@/store/gameStore";

export function ClaimSnackScreen() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  const sessionToken = useGameStore((s) => s.sessionToken);
  const discountCode = useGameStore((s) => s.discountCode) ?? "SAKURA2026";
  const setScreen = useGameStore((s) => s.setScreen);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/email/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken, displayName, email, consent, honeypot }),
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

  async function handleCopy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(discountCode);
      } else {
        copyWithTextArea(discountCode);
      }
      setCopyStatus("copied");
    } catch {
      try {
        copyWithTextArea(discountCode);
        setCopyStatus("copied");
      } catch {
        setCopyStatus("failed");
      }
    }
  }

  function copyWithTextArea(value: string) {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.select();

    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);

    if (!copied) {
      throw new Error("Copy command failed");
    }
  }

  return (
    <motion.div
      className="relative flex h-full w-full flex-col items-center overflow-hidden px-8 py-10 text-center"
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

      <div className="mt-10 flex flex-1 flex-col items-center justify-center gap-5">
        <Image
          src="/assets/ui/gift-pixel-transparent.png"
          alt="Gift"
          width={240}
          height={240}
          className="h-20 w-20 object-contain"
          priority
        />

        {!submitted && (
          <div className="space-y-3">
            <h2 className="text-[1.42rem] font-black leading-tight text-sakura-600 [text-shadow:2px_2px_0_#ffd3dd]">
              YOU&apos;RE IN!
            </h2>
            <p className="text-[0.86rem] font-bold leading-relaxed text-[#4D2809]">
              Enter your email
              <br />
              to get your
              <br />
              <span className="text-[1.05rem] text-sakura-600">FREE SNACK!</span>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex w-full max-w-[260px] flex-col gap-4">
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

          {!submitted && (
            <>
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

              <label className="flex cursor-pointer items-start gap-3 text-left text-[0.68rem] font-bold leading-relaxed text-[#4D2809]">
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-sakura-500"
                />
                <span>I agree to receive updates from Bloom Catcher</span>
              </label>
            </>
          )}

          {submitted ? (
            <div className="flex flex-col gap-3">
              <div className="rounded-lg border-2 border-dashed border-sakura-300 bg-white/85 px-6 py-5">
                <p className="text-[0.75rem] font-bold uppercase leading-none text-[#4D2809]">
                  Promo code
                </p>
                <p className="mt-3 break-all text-xl font-black text-sakura-600">{discountCode}</p>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="pixel-button w-full px-4 py-3 text-sm"
              >
                {copyStatus === "copied" ? "Copied" : "Copy"}
              </button>
              {copyStatus === "failed" && (
                <p className="text-[0.75rem] font-bold text-red-600">Copy failed</p>
              )}
              <button
                type="button"
                onClick={() => setScreen("leaderboard")}
                className="pixel-button w-full px-5 py-4 text-base"
              >
                Leaderboard
              </button>
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={submitting}
              className="pixel-button w-full px-4 py-4 text-sm"
            >
              {submitting ? "Checking..." : "GET MY SNACK"}
            </motion.button>
          )}
        </form>
      </div>
    </motion.div>
  );
}
