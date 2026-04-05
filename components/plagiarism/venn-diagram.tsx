"use client";

import { useId } from "react";
import type { StrategyVenn } from "@/types/analysis";

type Props = { venn: StrategyVenn };

export function VennDiagram({ venn }: Props) {
  const a = useId().replace(/:/g, "");
  const b = useId().replace(/:/g, "");
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-zinc-900/50 to-zinc-950 p-5 shadow-xl sm:p-7">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
      <div className="mb-6 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Positioning</p>
        <h4 className="mt-1 text-lg font-semibold text-white">Market vs. you</h4>
        <p className="mt-1 text-xs text-zinc-500">Shared scope and differentiation</p>
      </div>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
        <div className="relative mx-auto shrink-0">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
          </div>
          <svg viewBox="0 0 280 200" className="relative h-52 w-full max-w-[280px]" aria-hidden>
            <defs>
              <linearGradient id={a} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgb(99 102 241)" stopOpacity="0.45" />
                <stop offset="100%" stopColor="rgb(79 70 229)" stopOpacity="0.1" />
              </linearGradient>
              <linearGradient id={b} x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(167 139 250)" stopOpacity="0.45" />
                <stop offset="100%" stopColor="rgb(139 92 246)" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <circle cx="95" cy="100" r="72" fill={`url(#${a})`} stroke="rgb(129 140 248 / 0.45)" strokeWidth="1.5" />
            <circle cx="185" cy="100" r="72" fill={`url(#${b})`} stroke="rgb(196 181 253 / 0.45)" strokeWidth="1.5" />
            <text x="55" y="92" fill="rgb(199 210 254)" fontSize="12" fontWeight="600" textAnchor="middle">
              Market
            </text>
            <text x="225" y="92" fill="rgb(221 214 254)" fontSize="12" fontWeight="600" textAnchor="middle">
              You
            </text>
            <text x="140" y="108" fill="rgb(228 228 231)" fontSize="10" textAnchor="middle" opacity="0.85">
              overlap
            </text>
          </svg>
        </div>

        <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.07] bg-zinc-950/60 p-4 shadow-inner">
            <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-indigo-300">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
              Shared
            </p>
            <ul className="space-y-2 text-xs leading-relaxed text-zinc-400">
              {venn.shared_features.map((t, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-indigo-500/80">↗</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-b from-violet-500/10 to-transparent p-4 shadow-lg shadow-violet-950/20">
            <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-violet-300">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
              Unique to you
            </p>
            <ul className="space-y-2 text-xs leading-relaxed text-zinc-300">
              {venn.unique_to_you.map((t, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-violet-400/90">★</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-zinc-950/60 p-4 shadow-inner">
            <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
              Unique to market
            </p>
            <ul className="space-y-2 text-xs leading-relaxed text-zinc-500">
              {venn.unique_to_market.map((t, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-zinc-600">◇</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
