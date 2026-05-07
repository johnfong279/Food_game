"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { trackAnalyticsEvent } from "@/lib/analytics/client";
import { useGameStore } from "@/store/gameStore";

export function EndScreen() {
  const score = useGameStore((s) => s.score);
  const discountCode = useGameStore((s) => s.discountCode);
  const sessionToken = useGameStore((s) => s.sessionToken);
  const setScreen = useGameStore((s) => s.setScreen);

  useEffect(() => {
    trackAnalyticsEvent("end_view", "screen_view", { sessionToken });
  }, [sessionToken]);

  return (
    <motion.div
      className="relative flex flex-col items-center justify-center h-full w-full p-6 gap-6 overflow-hidden"
      style={{
        backgroundImage: "url('/assets/backgrounds/end-screen.png')",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <h2
        className="flex h-[58px] w-[300px] items-center justify-center bg-center bg-no-repeat text-sm font-bold leading-none text-[#4D2809] whitespace-nowrap"
        style={{
          backgroundImage: "url('/assets/ui/title-box-transparent.png')",
          backgroundSize: "100% 100%",
        }}
      >
        Your score
      </h2>

      <div className="text-center">
        <p className="text-[3.25rem] font-bold leading-none text-[#4D2809]">{score}</p>
      </div>

      {discountCode && (
        <>
          <p className="w-full text-center text-xs font-bold leading-tight text-[#4D2809]">
            Great job!
            <br />
            You&apos;ve earned a
            <br />
            <span className="text-sm text-sakura-600">FREE SNACK!</span>
          </p>
          <div className="w-full max-w-[190px] rounded-xl border-2 border-dotted border-sakura-300 bg-white/20 px-3 py-2 text-center backdrop-blur-[1px]">
            <Image
              src="/assets/game/items/potato-sticks-pack.png"
              alt="Potato sticks pack reward"
              width={1080}
              height={1080}
              className="mx-auto h-28 w-28 object-contain"
              priority
            />
          </div>
        </>
      )}

      <div className="mt-5 flex w-full max-w-[260px] flex-col">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            trackAnalyticsEvent("claim_snack_click", "button_click", { sessionToken });
            setScreen("claimSnack");
          }}
          className="pixel-button pixel-button-secondary w-full whitespace-nowrap px-4 py-4 text-xs"
        >
          Claim my snack
        </motion.button>
      </div>
    </motion.div>
  );
}
