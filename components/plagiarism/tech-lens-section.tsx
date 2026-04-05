"use client";

import type { ReactNode } from "react";
import type { AnalysisReport } from "@/types/analysis";

type Props = { report: AnalysisReport };

function SectionTitle({ children, icon }: { children: ReactNode; icon: ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-zinc-900/80 shadow-inner">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-white">{children}</h3>
    </div>
  );
}

export function TechLensSection({ report }: Props) {
  return (
    <div className="space-y-10">
      <div className="rounded-3xl border border-white/[0.07] bg-zinc-950/40 p-5 shadow-inner sm:p-6">
        <SectionTitle
          icon={
            <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          }
        >
          Tech lens · stack comparison
        </SectionTitle>
        <div className="overflow-hidden rounded-2xl border border-white/[0.06] shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-zinc-800/80 to-zinc-900/80 text-[11px] uppercase tracking-wider text-zinc-400">
                  <th className="px-4 py-3.5 font-semibold">Area</th>
                  <th className="px-4 py-3.5 font-semibold text-indigo-200/90">My stack</th>
                  <th className="px-4 py-3.5 font-semibold">Their stack</th>
                  <th className="px-4 py-3.5 font-semibold text-indigo-300">Your edge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {report.tech_comparison.map((row, i) => (
                  <tr
                    key={i}
                    className="bg-zinc-950/30 transition-colors hover:bg-indigo-950/[0.15]"
                  >
                    <td className="px-4 py-3.5 font-medium text-white">{row.area}</td>
                    <td className="px-4 py-3.5 text-indigo-200/90">{row.user_stack}</td>
                    <td className="px-4 py-3.5 text-zinc-500">{row.competitor_stack}</td>
                    <td className="relative px-4 py-3.5">
                      <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-gradient-to-b from-indigo-400 to-violet-500" />
                      <span className="pl-3 text-indigo-100/90">{row.advantage}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div>
        <SectionTitle
          icon={
            <svg className="h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.636l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          }
        >
          Smart recommendations
        </SectionTitle>
        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/[0.12] via-violet-600/[0.08] to-transparent p-5 shadow-xl shadow-indigo-950/20">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-500/20 blur-2xl" />
          <ul className="relative space-y-3 text-sm leading-relaxed text-indigo-100/85">
            {report.recommendations.map((line, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/30 text-[10px] font-bold text-white">
                  {i + 1}
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <SectionTitle
          icon={
            <svg className="h-5 w-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
        >
          Resource library
        </SectionTitle>
        <ul className="grid gap-3 sm:grid-cols-1">
          {report.references.map((ref, i) => (
            <li key={i}>
              <a
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-zinc-900/40 px-4 py-3.5 transition-all hover:border-indigo-500/35 hover:bg-zinc-800/50"
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold uppercase tracking-wide ${
                    ref.kind === "arxiv"
                      ? "bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/25"
                      : "bg-zinc-800 text-zinc-400 ring-1 ring-white/10"
                  }`}
                >
                  {ref.kind === "arxiv" ? "arx" : "git"}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-zinc-200 transition-colors group-hover:text-white">
                    {ref.title}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-zinc-600 group-hover:text-zinc-500">
                    {ref.url}
                  </span>
                </div>
                <svg
                  className="h-5 w-5 shrink-0 text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
