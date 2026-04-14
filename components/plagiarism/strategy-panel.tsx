"use client";

import type { AnalysisReport } from "@/types/analysis";
import { VennDiagram } from "./venn-diagram";

type Props = { report: AnalysisReport };

export function StrategyPanel({ report }: Props) {
  return (
    <div className="space-y-10">
      <VennDiagram venn={report.strategy.venn} />

      <div className="group/pivot relative overflow-hidden rounded-3xl border border-white/[0.08] bg-zinc-950/60 p-6 shadow-2xl transition-all duration-500 hover:border-white/10 sm:p-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent transition-opacity duration-500 group-hover/pivot:via-emerald-400/30" />
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 shadow-inner transition-transform duration-500 group-hover/pivot:scale-110 group-hover/pivot:rotate-3 group-hover/pivot:shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <svg className="h-6 w-6 text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)] transition-colors group-hover/pivot:text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">If the market is crowded</span>
            </div>
            <h4 className="text-xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">Market pivot ideas</h4>
          </div>
        </div>
        <ul className="space-y-4">
          {report.strategy.market_pivots.map((p, i) => (
            <li
              key={i}
              className="group/item flex items-center gap-4 rounded-2xl border border-white/5 bg-black/40 px-5 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.01] hover:border-emerald-500/40 hover:bg-zinc-900/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-sm font-bold text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400/50 transition-transform duration-300 group-hover/item:scale-110">
                {i + 1}
              </span>
              <span className="text-[13px] font-medium leading-relaxed text-zinc-300 transition-colors duration-300 group-hover/item:text-white">{p}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="group/monetize">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 shadow-inner transition-all duration-500 group-hover/monetize:scale-110 group-hover/monetize:-rotate-3 group-hover/monetize:shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <svg className="h-6 w-6 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)] transition-colors group-hover/monetize:text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
             <div className="mb-1 inline-flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">Revenue</span>
            </div>
            <h4 className="text-xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">Monetization models</h4>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {report.strategy.monetization.map((m, i) => (
            <div
              key={i}
              className="group/card relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-zinc-900/60 to-zinc-950/80 p-6 text-center shadow-2xl transition-all duration-500 hover:-translate-y-1.5 hover:border-amber-500/30 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.15),transparent_70%)] opacity-0 transition-opacity duration-500 group-hover/card:opacity-100" />
              <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-black/40 ring-1 ring-amber-500/10 transition-transform duration-500 group-hover/card:scale-110 group-hover/card:rotate-6 group-hover/card:shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                <svg className="h-6 w-6 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <p className="relative text-sm font-semibold leading-relaxed text-zinc-300 transition-colors duration-300 group-hover/card:text-white drop-shadow-sm">{m}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
