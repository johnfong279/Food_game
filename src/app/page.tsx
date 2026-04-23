"use client";

import { AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { LandingScreen } from "@/components/screens/LandingScreen";
import { GameScreen } from "@/components/screens/GameScreen";
import { EndScreen } from "@/components/screens/EndScreen";
import { EmailScreen } from "@/components/screens/EmailScreen";
import { LeaderboardScreen } from "@/components/screens/LeaderboardScreen";

export default function Home() {
  const screen = useGameStore((s) => s.screen);

  return (
    <main className="flex justify-center items-start min-h-screen bg-gradient-to-b from-sakura-100 to-sakura-50">
      {/* Phone-frame wrapper — fixed 400×700 logical canvas */}
      <div
        className="relative overflow-hidden bg-white shadow-2xl"
        style={{ width: 400, minHeight: 700, maxWidth: "100vw" }}
      >
        <AnimatePresence mode="wait">
          {screen === "landing" && <LandingScreen key="landing" />}
          {screen === "game" && <GameScreen key="game" />}
          {screen === "end" && <EndScreen key="end" />}
          {screen === "email" && <EmailScreen key="email" />}
          {screen === "leaderboard" && <LeaderboardScreen key="leaderboard" />}
        </AnimatePresence>

        {/* Landscape lock overlay */}
        <div className="absolute inset-0 bg-white flex flex-col items-center justify-center gap-4 z-50 landscape:flex portrait:hidden">
          <span className="text-4xl">📱</span>
          <p className="text-sakura-600 font-semibold text-center px-6">
            Please rotate your device to portrait mode.
          </p>
        </div>
      </div>
    </main>
  );
}
