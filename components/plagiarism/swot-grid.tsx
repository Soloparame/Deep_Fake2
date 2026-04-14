"use client";

import type { ReactNode } from "react";
import type { SwotBlock } from "@/types/analysis";

const quadrants: {
  key: keyof SwotBlock;
  label: string;
  icon: ReactNode;
  accent: string;
  ring: string;
  bg: string;
  dot: string;
}[] = [
    {
      key: "strengths",
      label: "Strengths",
      accent: "from-emerald-500/20 to-transparent",
      ring: "ring-emerald-500/25",
      bg: "bg-emerald-500/[0.06]",
      dot: "bg-emerald-400",
      icon: (
        <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    {
      key: "weaknesses",
      label: "Weaknesses",
      accent: "from-amber-500/20 to-transparent",
      ring: "ring-amber-500/25",
      bg: "bg-amber-500/[0.06]",
      dot: "bg-amber-400",
      icon: (
        <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      key: "opportunities",
      label: "Opportunities",
      accent: "from-sky-500/20 to-transparent",
      ring: "ring-sky-500/25",
      bg: "bg-sky-500/[0.06]",
      dot: "bg-sky-400",
      icon: (
        <svg className="h-5 w-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      key: "threats",
      label: "Threats",
      accent: "from-rose-500/20 to-transparent",
      ring: "ring-rose-500/25",
      bg: "bg-rose-500/[0.06]",
      dot: "bg-rose-400",
      icon: (
        <svg className="h-5 w-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M4.93 19h14.14c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
    },
  ];

type Props = { swot: SwotBlock };

export function SwotGrid({ swot }: Props) {
  return (
    <div className="group/swot relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-zinc-900/80 to-zinc-950/95 p-6 shadow-2xl transition-all duration-500 hover:border-white/10 hover:shadow-[0_0_30px_rgba(255,255,255,0.03)] sm:p-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent transition-opacity duration-500 group-hover/swot:via-white/20" />
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-zinc-700/50 bg-black/40 px-2.5 py-1 transition-colors group-hover/swot:border-zinc-500/50">
             <span className="h-1.5 w-1.5 rounded-full bg-zinc-400"></span>
             <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Positioning</p>
          </div>
          <h3 className="text-xl font-bold text-white drop-shadow-sm">SWOT matrix</h3>
        </div>
        <span className="hidden rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400 shadow-inner sm:inline transition-all hover:bg-white/10 hover:text-white">
          2 × 2
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {quadrants.map((q) => (
          <div
            key={q.key}
            className={`group/quad relative overflow-hidden rounded-2xl border border-white/[0.05] ${q.bg} p-5 ring-1 ${q.ring} transition-all duration-300 hover:-translate-y-1 hover:border-white/10 hover:shadow-lg`}
          >
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${q.accent} opacity-40 transition-opacity duration-300 group-hover/quad:opacity-80`} />
            <div className="relative mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/40 shadow-inner transition-transform duration-300 group-hover/quad:scale-110 group-hover/quad:rotate-3">
                {q.icon}
              </div>
              <span className="text-base font-bold text-white drop-shadow-sm">{q.label}</span>
            </div>
            <ul className="relative space-y-3 text-[13px] leading-relaxed text-zinc-300">
              {(swot[q.key] ?? []).map((line, i) => (
                <li key={i} className="group/item flex items-start gap-3 transition-colors hover:text-white">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${q.dot} opacity-70 transition-all duration-300 group-hover/item:scale-150 group-hover/item:opacity-100 group-hover/item:shadow-[0_0_8px_currentColor]`} />
                  <span className="flex-1">{line}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
