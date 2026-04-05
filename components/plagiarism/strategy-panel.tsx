"use client";

import type { AnalysisReport } from "@/types/analysis";
import { VennDiagram } from "./venn-diagram";

type Props = { report: AnalysisReport };

export function StrategyPanel({ report }: Props) {
  return (
    <div className="space-y-10">
      <VennDiagram venn={report.strategy.venn} />

      <div className="rounded-3xl border border-white/[0.07] bg-zinc-950/50 p-6 shadow-inner sm:p-7">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
            <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">If the market is crowded</p>
            <h4 className="text-lg font-semibold text-white">Market pivot ideas</h4>
          </div>
        </div>
        <ul className="space-y-3">
          {report.strategy.market_pivots.map((p, i) => (
            <li
              key={i}
              className="flex gap-4 rounded-2xl border border-white/[0.06] bg-zinc-900/40 px-4 py-3.5 transition-colors hover:border-indigo-500/25"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-bold text-white shadow-lg">
                {i + 1}
              </span>
              <span className="pt-0.5 text-sm leading-relaxed text-zinc-300">{p}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
            <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Revenue</p>
            <h4 className="text-lg font-semibold text-white">Monetization models</h4>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {report.strategy.monetization.map((m, i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-zinc-800/40 to-zinc-950/80 p-5 text-center shadow-lg transition-transform hover:-translate-y-1"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.12),transparent_65%)] opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/30">
                <svg className="h-5 w-5 text-amber-200/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <p className="relative text-sm font-medium leading-snug text-zinc-100">{m}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
