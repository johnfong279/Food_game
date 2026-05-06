"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { GAME_CLOSES_AT_MS, isGameClosed } from "@/lib/contest";
import { useGameStore } from "@/store/gameStore";

export function LandingScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameClosed, setGameClosed] = useState(() => isGameClosed());
  const setScreen = useGameStore((s) => s.setScreen);
  const setSessionToken = useGameStore((s) => s.setSessionToken);

  useEffect(() => {
    if (gameClosed) return;

    const msUntilClose = GAME_CLOSES_AT_MS - Date.now();
    if (msUntilClose <= 0) {
      setGameClosed(true);
      return;
    }

    const timeout = window.setTimeout(() => setGameClosed(true), msUntilClose);
    return () => window.clearTimeout(timeout);
  }, [gameClosed]);

  async function handleStart() {
    if (isGameClosed()) {
      setGameClosed(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/session/start", { method: "POST" });
      if (res.status === 403) {
        setGameClosed(true);
        return;
      }
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
        <Image
          src="/assets/branding/Applewood logo.png"
          alt="Applewood"
          width={970}
          height={600}
          priority
          className="absolute left-1/2 top-6 -translate-x-1/2 object-contain"
          style={{ width: 108, height: "auto" }}
        />

        {gameClosed ? (
          <>
            <div className="absolute left-1/2 top-[23%] -translate-x-1/2 -translate-y-1/2 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <Image
                  src="/assets/branding/bloom-catcher-end-bloom.png?v=20260506-split-title"
                  alt="Bloom"
                  width={1536}
                  height={310}
                  priority
                  className="object-contain"
                  style={{ width: 420, maxWidth: "none", imageRendering: "pixelated" }}
                />
              </motion.div>
            </div>
            <div className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.22, type: "spring" }}
              >
                <Image
                  src="/assets/branding/bloom-catcher-end-catcher.png?v=20260506-split-title"
                  alt="Catcher"
                  width={1536}
                  height={340}
                  priority
                  className="object-contain"
                  style={{ width: 420, maxWidth: "none", imageRendering: "pixelated" }}
                />
              </motion.div>
            </div>
            <div className="absolute left-1/2 top-[72%] -translate-x-1/2 -translate-y-1/2 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.25, type: "spring" }}
              >
                <Image
                  src="/assets/branding/bloom-catcher-end-message.png?v=20260506-split"
                  alt="The cherry blossoms have fallen. Thanks for playing. Stay tuned for the next event and more free snack rewards."
                  width={900}
                  height={254}
                  priority
                  className="object-contain"
                  style={{ width: 300, maxWidth: "none", imageRendering: "pixelated" }}
                />
              </motion.div>
            </div>
          </>
        ) : (
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
        )}

        {gameClosed ? (
          <motion.div
            className="absolute left-1/2 top-[90%] flex w-[300px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-7 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            <button
              type="button"
              onClick={() => setScreen("leaderboard")}
              className="pixel-button pixel-button-secondary w-[208px] px-3 py-3 text-[0.68rem] whitespace-nowrap"
            >
              Leaderboard
            </button>
          </motion.div>
        ) : error ? (
          <p className="absolute left-1/2 top-[55%] w-72 -translate-x-1/2 text-center text-sm font-semibold text-red-500">
            {error}
          </p>
        ) : null}

        {!gameClosed && (
          <Image
            src="/assets/branding/shiny potato pack.png"
            alt="Shiny Potato Pack"
            width={1396}
            height={1127}
            priority
            className="absolute left-1/2 top-[64%] -translate-x-1/2 -translate-y-1/2 object-contain"
            style={{ width: 188, height: "auto" }}
          />
        )}

        {!gameClosed && (
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
        )}
      </div>
    </motion.div>
  );
}
