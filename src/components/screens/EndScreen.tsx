"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/store/gameStore";

export function EndScreen() {
  const [copied, setCopied] = useState(false);

  const score = useGameStore((s) => s.score);
  const rank = useGameStore((s) => s.rank);
  const totalPlayers = useGameStore((s) => s.totalPlayers);
  const discountCode = useGameStore((s) => s.discountCode);
  const setScreen = useGameStore((s) => s.setScreen);
  const reset = useGameStore((s) => s.reset);

  function handleCopy() {
    if (discountCode) {
      navigator.clipboard.writeText(discountCode).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  function handlePlayAgain() {
    reset();
  }

  const isTopThree = rank !== null && rank <= 3;

  return (
    <motion.div
      className="flex flex-col items-center justify-center h-full w-full p-6 gap-6"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.1 }}
        className="text-5xl"
      >
        {isTopThree ? "🏆" : "🌸"}
      </motion.div>

      <h2 className="text-3xl font-bold text-sakura-700">Game Over!</h2>

      <div className="bg-sakura-50 rounded-2xl p-5 w-full max-w-xs text-center space-y-2">
        <p className="text-5xl font-bold text-sakura-600">{score}</p>
        <p className="text-sakura-400 text-sm">points</p>
        {rank !== null && (
          <p className="text-sakura-600 font-semibold">
            Rank #{rank} of {totalPlayers ?? "?"} players
          </p>
        )}
      </div>

      {discountCode && (
        <div className="bg-white border-2 border-sakura-300 rounded-2xl p-4 w-full max-w-xs text-center">
          <p className="text-sm text-sakura-500 mb-1">Your discount code</p>
          <p className="text-2xl font-mono font-bold text-sakura-700">{discountCode}</p>
          <button
            onClick={handleCopy}
            className="mt-2 text-sm text-sakura-500 hover:text-sakura-700 underline"
          >
            {copied ? "✓ Copied!" : "Copy code"}
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {isTopThree && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setScreen("email")}
            className="bg-sakura-500 text-white font-bold py-3 rounded-full shadow-md"
          >
            🎁 Claim Prize (Top {rank})
          </motion.button>
        )}
        <button
          onClick={() => setScreen("leaderboard")}
          className="border-2 border-sakura-400 text-sakura-600 font-semibold py-3 rounded-full"
        >
          🏅 View Leaderboard
        </button>
        <button
          onClick={handlePlayAgain}
          className="text-sakura-400 text-sm underline"
        >
          Play Again
        </button>
      </div>
    </motion.div>
  );
}
