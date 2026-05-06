"use client";

import { useState } from "react";
import Image from "next/image";

interface ValidEmailScreenProps {
  discountCode: string;
  onLeaderboard: () => void;
}

export function ValidEmailScreen({ discountCode, onLeaderboard }: ValidEmailScreenProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function handleCopy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(discountCode);
      } else {
        copyWithTextArea(discountCode);
      }
      setCopyStatus("copied");
    } catch {
      try {
        copyWithTextArea(discountCode);
        setCopyStatus("copied");
      } catch {
        setCopyStatus("failed");
      }
    }
  }

  function copyWithTextArea(value: string) {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.select();

    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);

    if (!copied) {
      throw new Error("Copy command failed");
    }
  }

  return (
    <div className="flex w-full max-w-[310px] flex-col gap-3">
      <Image
        src="/assets/branding/shiny potato pack.png"
        alt="Shiny Potato Pack"
        width={1396}
        height={1127}
        className="mx-auto h-36 w-36 object-contain"
        priority
      />

      <div className="rounded-lg border-2 border-dashed border-sakura-300 bg-white/85 px-6 py-5">
        <p className="text-[0.75rem] font-bold uppercase leading-none text-[#4D2809]">
          Promo code
        </p>
        <p className="mt-3 break-all text-xl font-black text-sakura-600">{discountCode}</p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="pixel-button w-full px-4 py-3 text-base"
      >
        {copyStatus === "copied" ? "Copied" : "Copy"}
      </button>
      {copyStatus === "failed" && (
        <p className="text-[0.75rem] font-bold text-red-600">Copy failed</p>
      )}
      <button
        type="button"
        onClick={onLeaderboard}
        className="pixel-button w-full px-5 py-4 text-base"
      >
        Leaderboard
      </button>
    </div>
  );
}
