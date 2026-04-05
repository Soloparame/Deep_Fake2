"use client";

import { useId } from "react";
import type { AnalysisReport } from "@/types/analysis";

type Props = {
  report: AnalysisReport;
};

export function SimilarityGauge({ report }: Props) {
  const gradId = useId().replace(/:/g, "");
  const pct = Math.min(100, Math.max(0, report.similarity_score));
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-zinc-900/60 to-zinc-950/90 p-6 shadow-xl ring-1 ring-white/[0.04] sm:p-8">
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />

      <div className="relative mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Similarity</p>
          <p className="mt-0.5 text-lg font-semibold text-white">Overlap index</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 font-mono text-xs text-indigo-200/90">
          {Math.round(pct)} / 100
        </div>
      </div>

      <div className="relative mx-auto flex h-44 w-44 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-indigo-500/10 blur-2xl" />
        <div className="absolute inset-2 rounded-full border border-white/[0.06]" />
        <svg className="relative -rotate-90 transform" viewBox="0 0 120 120" aria-hidden>
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgb(39 39 42)" strokeWidth="9" />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-1000 ease-out"
          />
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(129 140 248)" />
              <stop offset="50%" stopColor="rgb(99 102 241)" />
              <stop offset="100%" stopColor="rgb(167 139 250)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-nacelle text-4xl font-bold tracking-tight text-white">{Math.round(pct)}%</span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-indigo-300/70">similar</span>
        </div>
      </div>

      <p className="relative mt-6 text-center text-xs leading-relaxed text-zinc-500">
        Relative overlap with indexed sources and public descriptions. Replace with your model when ready.
      </p>
    </div>
  );
}
