"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import type { LeaderboardEntry } from "@/schemas/leaderboard";

export function LeaderboardScreen() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [yourRank, setYourRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const sessionToken = useGameStore((s) => s.sessionToken);
  const reset = useGameStore((s) => s.reset);

  useEffect(() => {
    const params = sessionToken ? `?sessionToken=${encodeURIComponent(sessionToken)}` : "";
    fetch(`/api/leaderboard${params}`)
      .then((r) => r.json())
      .then((data) => {
        setEntries(data.top10 ?? []);
        setYourRank(data.yourRank ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionToken]);

  const medalFor = (rank: number) => (rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null);

  return (
    <motion.div
      className="flex flex-col h-full w-full"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
    >
      <div className="bg-sakura-500 text-white text-center py-4 px-4 flex items-center justify-between">
        <span className="text-lg font-bold">🏅 Leaderboard</span>
        {yourRank !== null && (
          <span className="text-sm bg-white/20 rounded-full px-3 py-1">Your rank: #{yourRank}</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading && (
          <div className="flex justify-center py-12">
            <span className="animate-spin text-2xl">🌸</span>
          </div>
        )}

        {!loading && entries.length === 0 && (
          <p className="text-center text-sakura-400 py-8">No scores yet. Be the first!</p>
        )}

        {entries.map((entry, i) => {
          const isYou = yourRank !== null && entry.rank === yourRank;
          const medal = medalFor(entry.rank);
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center justify-between rounded-xl px-4 py-3 ${
                isYou ? "bg-sakura-100 border-2 border-sakura-400" : "bg-white shadow-sm"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl w-8 text-center">
                  {medal ?? <span className="text-sakura-300 text-sm">#{entry.rank}</span>}
                </span>
                <span className={`font-semibold ${isYou ? "text-sakura-700" : "text-gray-700"}`}>
                  {isYou ? "You" : `Player`}
                </span>
              </div>
              <span className="font-bold text-sakura-600">{entry.score} pts</span>
            </motion.div>
          );
        })}
      </div>

      <div className="p-4 border-t border-sakura-100">
        <button
          onClick={reset}
          className="w-full bg-sakura-500 text-white font-bold py-3 rounded-full"
        >
          Play Again
        </button>
      </div>
    </motion.div>
  );
}
