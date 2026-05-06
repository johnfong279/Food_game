"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useGameStore } from "@/store/gameStore";
import type { LeaderboardEntry } from "@/schemas/leaderboard";

export function LeaderboardScreen() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [yourRank, setYourRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const sessionToken = useGameStore((s) => s.sessionToken);

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

  return (
    <motion.div
      className="relative flex h-full w-full flex-col items-center overflow-hidden px-7 text-center"
      style={{
        backgroundImage: "url('/assets/backgrounds/leaderboard.png')",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex h-[20%] w-full flex-col items-center justify-end pb-1">
        <h1
          className="relative flex h-[58px] w-[300px] items-center justify-center bg-center bg-no-repeat text-sm font-black uppercase leading-none text-[#4D2809] whitespace-nowrap"
          style={{
            backgroundImage: "url('/assets/ui/title-box-transparent.png')",
            backgroundSize: "100% 100%",
          }}
        >
          Leaderboard
        </h1>
      </div>

      <p className="text-[0.72rem] font-bold text-[#4D2809]">Live Ranking</p>

      <div className="mt-3 w-full max-w-[292px] overflow-hidden rounded-lg border-2 border-[#b68a65] bg-[#FBE8D6] text-[#4D2809]">
        {loading && (
          <div className="flex h-[312px] items-center justify-center">
            <Image
              src="/assets/game/petals/sakura-leaf-1.png"
              alt="Loading"
              width={32}
              height={32}
              className="h-8 w-8 animate-spin object-contain"
              priority
            />
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div className="flex h-[312px] items-center justify-center px-6 text-[0.72rem] font-bold leading-relaxed text-sakura-600">
            No scores yet.
            <br />
            Be the first!
          </div>
        )}

        {!loading && entries.length > 0 && entries.map((entry, i) => {
          const isYou = yourRank !== null && entry.rank === yourRank;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`grid h-[42px] grid-cols-[42px_1fr_72px] items-center border-b border-[#d8b98f] px-3 text-[0.68rem] font-bold last:border-b-0 ${
                isYou ? "bg-sakura-300/80 text-[#4D2809]" : "bg-[#FBE8D6]"
              }`}
            >
              <span>{String(entry.rank).padStart(2, "0")}</span>
              <span className="truncate text-left">{isYou ? "YOU" : entry.name}</span>
              <span className="text-right">{entry.score}</span>
            </motion.div>
          );
        })}
      </div>

      <a
        href="https://applewood-signature.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="pixel-button pixel-button-secondary absolute bottom-6 w-[208px] px-3 py-3 text-[0.68rem] whitespace-nowrap"
      >
        Get my snack
      </a>
    </motion.div>
  );
}
