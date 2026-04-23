"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GameEngine } from "@/game/GameEngine";
import { useGameStore } from "@/store/gameStore";

export function GameScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);

  const sessionToken = useGameStore((s) => s.sessionToken);
  const score = useGameStore((s) => s.score);
  const petalsCaught = useGameStore((s) => s.petalsCaught);
  const snacksCaught = useGameStore((s) => s.snacksCaught);
  const events = useGameStore((s) => s.events);
  const addScore = useGameStore((s) => s.addScore);
  const recordEvent = useGameStore((s) => s.recordEvent);
  const setResult = useGameStore((s) => s.setResult);
  const setScreen = useGameStore((s) => s.setScreen);
  const setDuration = useGameStore((s) => s.setDuration);

  useEffect(() => {
    setDisplayScore(score);
  }, [score]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const startTs = Date.now();

    const engine = new GameEngine(canvasRef.current, {
      onScore: (points, type) => addScore(points, type),
      onEvent: (event) => recordEvent(event),
      onEnd: async () => {
        const duration = Date.now() - startTs;
        setDuration(duration);
        engineRef.current = null;

        try {
          const res = await fetch("/api/score/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionToken,
              score: useGameStore.getState().score,
              petalsCaught: useGameStore.getState().petalsCaught,
              snacksCaught: useGameStore.getState().snacksCaught,
              durationMs: duration,
              events: useGameStore.getState().events,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            setResult(data);
          }
        } catch {
          // proceed to end screen even on error
        }
        setScreen("end");
      },
    });

    engineRef.current = engine;
    engine.start();

    const timer = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);

    return () => {
      clearInterval(timer);
      engine.destroy();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      className="flex flex-col items-center justify-start h-full w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* HUD */}
      <div className="w-full flex justify-between items-center px-4 py-2 bg-sakura-100/80 backdrop-blur z-10">
        <span className="text-sakura-700 font-bold text-xl">Score: {displayScore}</span>
        <span
          className={`font-bold text-xl ${timeLeft <= 10 ? "text-red-600 animate-pulse" : "text-sakura-700"}`}
        >
          {timeLeft}s
        </span>
      </div>

      {/* Canvas */}
      <div className="relative flex-1 w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full touch-none"
          style={{ cursor: "crosshair" }}
        />
      </div>
    </motion.div>
  );
}
