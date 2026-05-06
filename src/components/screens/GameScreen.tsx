"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GameEngine } from "@/game/GameEngine";
import { useGameStore } from "@/store/gameStore";

export function GameScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(35);

  const sessionToken = useGameStore((s) => s.sessionToken);
  const score = useGameStore((s) => s.score);
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
      onTimeLeft: setTimeLeft,
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

    return () => {
      engine.destroy();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <motion.div
      className="absolute inset-0 h-full w-full overflow-hidden bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="game-hud absolute left-0 right-0 top-0 z-10 flex items-start justify-center gap-3 px-4 pt-4">
        <div className="hud-stat-panel w-[106px]" aria-label={`Score ${displayScore}`}>
          <span className="hud-stat-label">Score</span>
          <span className="hud-stat-value">{displayScore}</span>
        </div>

        <div className="hud-stat-panel w-[106px]" aria-label={`Time ${formattedTime}`}>
          <span className="hud-stat-label">Time</span>
          <span className={`hud-stat-value ${timeLeft <= 10 ? "hud-stat-value-warning" : ""}`}>
            {formattedTime}
          </span>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 touch-none"
        style={{ cursor: "crosshair" }}
      />
    </motion.div>
  );
}
