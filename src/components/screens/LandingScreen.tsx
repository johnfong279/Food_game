"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useGameStore } from "@/store/gameStore";

export function LandingScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setScreen = useGameStore((s) => s.setScreen);
  const setSessionToken = useGameStore((s) => s.setSessionToken);

  async function handleStart() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/session/start", { method: "POST" });
      if (!res.ok) throw new Error("Failed to start session");
      const { sessionToken } = await res.json();
      setSessionToken(sessionToken);
      setScreen("game");
    } catch {
      setError("Could not start game. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      className="absolute inset-0 flex h-full w-full flex-col items-center justify-center overflow-hidden"
      style={{
        backgroundImage: "url('/assets/effects/leaves-blowing/gameplay-leaves-blowing.gif')",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="z-10 absolute inset-0">
        <div className="absolute left-1/2 top-[35%] -translate-x-1/2 -translate-y-1/2 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <Image
              src="/assets/branding/bloom-catcher-text.png"
              alt="Bloom Catcher. Play the game, win free snack!"
              width={1536}
              height={1024}
              priority
              className="object-contain"
              style={{ width: 420, maxWidth: "none", imageRendering: "pixelated" }}
            />
          </motion.div>
        </div>

        {error && (
          <p className="absolute left-1/2 top-[55%] w-72 -translate-x-1/2 text-center text-sm font-semibold text-red-500">
            {error}
          </p>
        )}

        <div className="absolute left-1/2 top-[84%] -translate-x-1/2 -translate-y-1/2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            disabled={loading}
            aria-busy={loading}
            aria-label={loading ? "Starting game" : "Start game"}
            className="start-image-button"
          >
            <span className="sr-only">{loading ? "Starting game" : "Start game"}</span>
          </motion.button>
        </div>

        <Link
          href="/terms"
          className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/85 px-4 py-2 text-[0.55rem] font-semibold uppercase tracking-normal text-sakura-600 shadow-md transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-sakura-300"
        >
          T&amp;C
        </Link>
      </div>
    </motion.div>
  );
}
