"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
    } catch (e) {
      setError("Could not start game. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      className="flex flex-col items-center justify-center h-full w-full relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Animated background petals */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-3xl pointer-events-none select-none"
          initial={{ y: -40, x: `${(i * 8) % 100}%`, opacity: 0.6 }}
          animate={{ y: "110%", rotate: 360 }}
          transition={{ duration: 4 + (i % 4), repeat: Infinity, delay: i * 0.5, ease: "linear" }}
        >
          🌸
        </motion.div>
      ))}

      <div className="z-10 flex flex-col items-center gap-6 p-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="text-center"
        >
          <div className="text-6xl mb-2">🌸</div>
          <h1 className="text-4xl font-bold text-sakura-700">Sakura Snack</h1>
          <p className="text-sakura-500 mt-2 text-lg">Catch petals &amp; snacks to win!</p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-sm text-sakura-600 bg-sakura-50 rounded-2xl p-4 max-w-xs"
        >
          <p>Tap falling sakura petals and Japanese snacks as fast as you can.</p>
          <p className="mt-1 font-semibold">Top players win a discount code! 🎁</p>
        </motion.div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleStart}
          disabled={loading}
          className="bg-sakura-500 hover:bg-sakura-600 active:bg-sakura-700 text-white font-bold text-xl px-10 py-4 rounded-full shadow-lg disabled:opacity-60 transition-colors"
        >
          {loading ? "Starting…" : "▶ Start Game"}
        </motion.button>
      </div>
    </motion.div>
  );
}
