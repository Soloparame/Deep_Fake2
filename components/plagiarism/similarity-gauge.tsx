"use client";

import { useId } from "react";
import type { AnalysisReport } from "@/types/analysis";

type Props = {
  report: AnalysisReport;
};

export function SimilarityGauge({ report }: Props) {
  const gradId = useId().replace(/:/g, "");
  const pct = Math.min(100, Math.max(0, report.similarity_score));
  const badge = (report.similarity_label || "similar").toLowerCase();
  const blurb =
    report.similarity_description ||
    "Relative overlap with indexed sources and public descriptions.";
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="group/gauge relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/80 to-zinc-950/95 p-6 shadow-2xl transition-all duration-500 hover:shadow-indigo-500/10 hover:border-indigo-500/20 sm:p-8">
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl transition-opacity duration-500 group-hover/gauge:opacity-80" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent transition-opacity duration-500 group-hover/gauge:via-indigo-400/50" />

      <div className="relative mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Similarity</p>
          <p className="mt-0.5 text-lg font-semibold text-white">Overlap index</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 font-mono text-xs text-indigo-200/90">
          {Math.round(pct)} / 100
        </div>
      </div>

      <div className="relative mx-auto flex h-48 w-48 items-center justify-center transition-transform duration-500 group-hover/gauge:scale-105">
        <div className="absolute inset-0 rounded-full bg-indigo-500/15 blur-[30px] transition-all duration-500 group-hover/gauge:bg-indigo-500/25 group-hover/gauge:blur-[40px]" />
        <div className="absolute inset-3 rounded-full border border-white/10" />
        <svg className="relative -rotate-90 transform drop-shadow-xl" viewBox="0 0 120 120" aria-hidden>
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-[1.5s] ease-out shadow-lg shadow-indigo-500/50"
          />
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-nacelle text-5xl font-bold tracking-tight text-white drop-shadow-sm transition-all duration-300 group-hover/gauge:text-indigo-100">{Math.round(pct)}%</span>
          <span className="mt-1 text-[11px] font-bold uppercase tracking-widest text-indigo-300/80 transition-colors group-hover/gauge:text-indigo-300">{badge}</span>
        </div>
      </div>

      {report.similarity_hf_live === false && (
        <p className="relative mb-3 text-center text-[11px] font-medium text-amber-200/90">
          Using fallback score — add HF_TOKEN for live MiniLM similarity.
        </p>
      )}

      <p className="relative mt-6 text-center text-xs leading-relaxed text-zinc-500">{blurb}</p>

      {report.found_projects?.length ? (
        <div className="relative mt-6 overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-b from-indigo-500/10 to-transparent p-4 shadow-[0_0_20px_rgba(99,102,241,0.05)] backdrop-blur-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-60"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
              </span>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-200">
                Competitors Found
              </p>
            </div>
            <span className="rounded-full border border-indigo-400/30 bg-indigo-500/20 px-2.5 py-0.5 text-[11px] font-bold text-indigo-200">
              {report.found_projects.length}
            </span>
          </div>
          <div className="space-y-2.5">
            {report.found_projects.slice(0, 4).map((p, idx) => (
              <a
                key={`${p.link}-${idx}`}
                href={p.link}
                target="_blank"
                rel="noreferrer"
                className="group relative block overflow-hidden rounded-xl border border-white/10 bg-black/40 px-4 py-3 transition-all duration-300 hover:border-indigo-500/50 hover:bg-white/5 hover:shadow-[0_0_15px_rgba(99,102,241,0.1)] hover:-translate-y-0.5"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/0 to-indigo-500/0 transition-all duration-500 group-hover:from-indigo-500/5 group-hover:to-purple-500/5" />
                <p className="relative truncate text-sm font-semibold text-white transition-colors duration-300 group-hover:text-indigo-300">
                  {p.name}
                  <svg className="ml-1.5 inline-block h-3 w-3 text-indigo-400/50 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </p>
                <p className="relative mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-400 transition-colors group-hover:text-zinc-300">{p.snippet}</p>
                <p className="relative mt-2 truncate text-[10px] text-zinc-500 group-hover:text-indigo-400/70">{p.link}</p>
              </a>
            ))}
          </div>
        </div>
      ) : (
        <div className="relative mt-6 overflow-hidden rounded-2xl border border-amber-400/25 bg-gradient-to-b from-amber-500/10 to-transparent p-4 shadow-[0_0_20px_rgba(245,158,11,0.08)] backdrop-blur-sm sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-amber-300/70"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400"></span>
              </span>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200">
                Competitor Discovery
              </p>
            </div>
            <span className="rounded-full border border-amber-300/40 bg-amber-400/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-100">
              0 found
            </span>
          </div>
          <p className="text-sm leading-relaxed text-zinc-300">
            No competitor links were confidently extracted for this run. This can happen with short inputs,
            low-coverage market snippets, or temporary search/rate-limit issues.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-[11px] text-zinc-300">
              <span className="font-semibold text-amber-200">Tip 1:</span> add a clearer domain description and target market.
            </div>
            <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-[11px] text-zinc-300">
              <span className="font-semibold text-amber-200">Tip 2:</span> include your tech stack and user segment details.
            </div>
          </div>
        </div>
      )}

      {report.market_search_snippet ? (
        <details className="group/details relative mt-5 rounded-xl border border-white/5 bg-black/30 px-4 py-3 text-left transition-all hover:border-white/10">
          <summary className="cursor-pointer text-[12px] font-medium text-zinc-400 group-hover/details:text-zinc-300 list-none flex justify-between items-center [&::-webkit-details-marker]:hidden">
            <span>Market & web reference text</span>
            <svg className="h-4 w-4 transition-transform group-open/details:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="mt-3 overflow-hidden rounded-lg bg-black/40 border border-white/5 p-3 relative">
             <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
             <p className="max-h-40 custom-scrollbar overflow-y-auto text-[11px] leading-relaxed text-zinc-400 pr-2">{report.market_search_snippet}</p>
          </div>
        </details>
      ) : null}
    </div>
  );
}
