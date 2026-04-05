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
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-zinc-900/50 to-zinc-950/95 p-6 shadow-xl ring-1 ring-white/[0.04] sm:p-7">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Positioning</p>
          <h3 className="mt-0.5 text-lg font-semibold text-white">SWOT matrix</h3>
        </div>
        <span className="hidden rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500 sm:inline">
          2×2
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {quadrants.map((q) => (
          <div
            key={q.key}
            className={`group relative overflow-hidden rounded-2xl border border-white/[0.06] ${q.bg} p-4 ring-1 ${q.ring} transition-transform duration-300 hover:-translate-y-0.5`}
          >
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${q.accent} opacity-60`} />
            <div className="relative mb-3 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/20">
                {q.icon}
              </div>
              <span className="text-sm font-semibold text-white">{q.label}</span>
            </div>
            <ul className="relative space-y-2.5 text-sm leading-snug text-zinc-300/95">
              {(swot[q.key] ?? []).map((line, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${q.dot} opacity-80`} />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
