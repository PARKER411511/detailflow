"use client";

import Image from "next/image";
import { useState } from "react";

export function BeforeAfter() {
  const [position, setPosition] = useState(52);
  return (
    <div className="before-after group relative overflow-hidden bg-[#0b1739]">
      <Image
        src="/images/detailflow-hero.png"
        alt="AI-generated illustrative after concept: blue coupe in a dark studio"
        fill
        sizes="(max-width: 1024px) 100vw, 62vw"
        className="object-cover"
      />
      <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${position}%` }}>
        <Image
          src="/images/detailflow-before.png"
          alt="AI-generated illustrative before concept: dusty blue coupe in a dark studio"
          fill
          sizes="(max-width: 1024px) 100vw, 62vw"
          className="object-cover object-left"
        />
      </div>
      <div className="pointer-events-none absolute inset-y-0" style={{ left: `${position}%` }}>
        <div className="h-full w-px bg-white shadow-[0_0_0_1px_rgba(11,23,57,.25)]" />
        <div className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white bg-[#2563eb] text-xs font-bold text-white shadow-lg">
          ↔
        </div>
      </div>
      <label className="absolute inset-0 cursor-ew-resize" aria-label="Compare the illustrative before and after images">
        <input
          type="range"
          min="0"
          max="100"
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
          className="sr-only"
        />
      </label>
      <div className="pointer-events-none absolute left-5 top-5 border border-white/50 bg-[#0b1739]/70 px-3 py-2 text-[10px] font-bold uppercase tracking-[.16em] text-white backdrop-blur-sm">
        Before / after concept
      </div>
      <div className="pointer-events-none absolute bottom-5 left-5 right-5 flex justify-between text-[10px] font-bold uppercase tracking-[.16em] text-white">
        <span>Before · illustrative</span>
        <span>After · illustrative</span>
      </div>
    </div>
  );
}
