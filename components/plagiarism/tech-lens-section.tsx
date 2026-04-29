"use client";

import type { ReactNode } from "react";
import type { AnalysisReport } from "@/types/analysis";

type Props = { report: AnalysisReport };

function SectionTitle({ children, icon }: { children: ReactNode; icon: ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-100 bg-white shadow-inner">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-slate-900">{children}</h3>
    </div>
  );
}

export function TechLensSection({ report }: Props) {
  if (!report.tech_comparison || report.tech_comparison.length === 0) {
    return null;
  }

  return (
    <div className="space-y-10">
      <div className="group/tech focus-within:ring-indigo-500/20 relative overflow-hidden rounded-3xl border border-indigo-100 bg-white p-5 shadow-xl transition-all duration-500 hover:border-indigo-200 sm:p-7">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent transition-opacity duration-500 group-hover/tech:via-indigo-400/30" />
        <SectionTitle
          icon={
            <svg className="h-5 w-5 text-indigo-400 transition-transform duration-500 group-hover/tech:scale-110 group-hover/tech:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          }
        >
          Tech lens · stack comparison
        </SectionTitle>
        <div className="overflow-hidden rounded-2xl border border-indigo-100 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-50 to-white text-[11px] uppercase tracking-wider text-slate-500 backdrop-blur-sm">
                  <th className="px-5 py-4 font-semibold">Area</th>
                  <th className="px-5 py-4 font-semibold text-indigo-200/90">My stack</th>
                  <th className="px-5 py-4 font-semibold text-slate-500">Their stack</th>
                  <th className="px-5 py-4 font-semibold text-indigo-600">Your edge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-100">
                {report.tech_comparison.map((row, i) => (
                  <tr
                    key={i}
                    className="group border-transparent bg-white transition-all duration-300 hover:bg-indigo-50/50 hover:shadow-sm"
                  >
                    <td className="px-5 py-4 font-medium text-slate-800 transition-colors group-hover:text-indigo-700">{row.area}</td>
                    <td className="px-5 py-4 text-indigo-700 transition-colors group-hover:text-indigo-800">{row.user_stack}</td>
                    <td className="px-5 py-4 text-slate-600 transition-colors group-hover:text-slate-700">{row.competitor_stack}</td>
                    <td className="relative px-5 py-4">
                      <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-gradient-to-b from-indigo-500 to-violet-500 opacity-50 transition-opacity duration-300 group-hover:opacity-100 group-hover:shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                      <span className="pl-3 font-medium text-indigo-700 transition-colors group-hover:text-indigo-800">{row.advantage}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="group/recom relative">
        <SectionTitle
          icon={
            <svg className="h-5 w-5 text-violet-400 transition-transform duration-500 group-hover/recom:scale-110 group-hover/recom:text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.636l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          }
        >
          Smart recommendations
        </SectionTitle>
        <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-violet-50/60 to-white p-6 shadow-sm transition-all duration-500 group-hover/recom:border-indigo-200 sm:p-7">
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-violet-500/20 blur-[50px] transition-all duration-500 group-hover/recom:bg-violet-500/30 group-hover/recom:blur-[60px]" />
          <ul className="relative space-y-4 text-[13px] leading-relaxed text-slate-700">
            {report.recommendations.map((line, i) => (
              <li key={i} className="group/li flex items-start gap-4 transition-colors duration-300 hover:text-slate-900">
                <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-[11px] font-bold text-indigo-300 ring-1 ring-indigo-500/30 transition-all duration-300 group-hover/li:bg-indigo-500/40 group-hover/li:text-white group-hover/li:shadow-[0_0_10px_rgba(99,102,241,0.4)]">
                  {i + 1}
                </span>
                <span className="flex-1">{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="group/lib">
        <SectionTitle
          icon={
            <svg className="h-5 w-5 text-sky-400 transition-transform duration-500 group-hover/lib:scale-110 group-hover/lib:text-sky-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
        >
          Resource library
        </SectionTitle>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {report.references.map((ref, i) => (
            <li key={i}>
              <a
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-start gap-4 rounded-2xl border border-indigo-100 bg-white px-5 py-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50/40 sm:flex-row sm:items-center"
              >
                <div className="flex w-full sm:w-auto items-center justify-between sm:justify-start">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold uppercase tracking-wide transition-colors ${
                      ref.kind === "arxiv"
                        ? "bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30 group-hover:bg-orange-500/25 group-hover:shadow-[0_0_10px_rgba(249,115,22,0.3)]"
                        : "bg-zinc-800/80 text-zinc-300 ring-1 ring-white/10 group-hover:bg-zinc-700/80 group-hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                    }`}
                  >
                    {ref.kind === "arxiv" ? "arx" : "git"}
                  </span>
                  <svg className="h-4 w-4 shrink-0 text-zinc-600 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-sky-400 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-slate-700 transition-colors group-hover:text-slate-900">
                    {ref.title}
                  </span>
                  <span className="mt-1 block truncate text-[11px] tracking-wide text-slate-500 transition-colors group-hover:text-sky-700/80">
                    {ref.url}
                  </span>
                </div>
                <svg className="hidden h-5 w-5 shrink-0 text-zinc-600 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-sky-400 sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
