"use client";

import Image from "next/image";
import { useState } from "react";

export function BeforeAfter() {
  const [position, setPosition] = useState(52);
  return (
    <div className="before-after group relative overflow-hidden bg-[#0b1739]">
      <Image src="/images/detailflow-surface-after-v2.png" alt="AI-generated illustrative after concept showing cleared paint and crisp studio reflections" fill sizes="(max-width: 1024px) 100vw, 62vw" className="object-cover" />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}><Image src="/images/detailflow-surface-before-v2.png" alt="AI-generated illustrative before concept showing fine wash marks on a navy painted surface" fill sizes="(max-width: 1024px) 100vw, 62vw" className="object-cover" /></div>
      <div className="pointer-events-none absolute inset-y-0" style={{ left: `${position}%` }}><div className="h-full w-px bg-white shadow-[0_0_0_1px_rgba(11,23,57,.25)]" /><div className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center border border-white bg-[#2563eb] text-xs font-bold text-white shadow-lg">↔</div></div>
      <label className="absolute inset-0 z-20 cursor-ew-resize rounded-none focus-within:ring-2 focus-within:ring-white focus-within:ring-inset" aria-label="Compare the illustrative before and after images">
        <input type="range" min="0" max="100" value={position} onChange={(event) => setPosition(Number(event.target.value))} className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
      </label>
      <div className="pointer-events-none absolute left-4 top-4 border border-white/50 bg-[#0b1739]/70 px-2 py-1 text-[10px] font-bold uppercase tracking-[.14em] text-white backdrop-blur-sm">Before / after</div>
      <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex justify-between text-[10px] font-bold uppercase tracking-[.14em] text-white"><span>Before<span className="hidden sm:inline"> · illustrative</span></span><span>After<span className="hidden sm:inline"> · illustrative</span></span></div>
    </div>
  );
}
