"use client";

import { useCallback, useEffect } from "react";
import { SimilarityGauge } from "@/components/plagiarism/similarity-gauge";
import { DevilsAdvocateCard } from "@/components/plagiarism/devils-advocate-card";
import { StrategyPanel } from "@/components/plagiarism/strategy-panel";
import { SwotGrid } from "@/components/plagiarism/swot-grid";
import { TechLensSection } from "@/components/plagiarism/tech-lens-section";
import type { AnalysisReport } from "@/types/analysis";

type Tab = "overview" | "strategy";

function safeFilenamePart(s: string) {
  return s
    .trim()
    .replace(/[^\w\- ]+/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 80) || "analysis";
}

function buildTextReport(report: AnalysisReport): string {
  const lines: string[] = [
    `RealEye — Analysis report`,
    `═══════════════════════`,
    ``,
    `Title: ${report.title}`,
    ``,
    `Description:`,
    report.description || "(none)",
    ``,
    `Similarity score: ${report.similarity_score}%`,
    ``,
    `--- SWOT ---`,
    `Strengths:`,
    ...report.swot.strengths.map((x) => `  • ${x}`),
    `Weaknesses:`,
    ...report.swot.weaknesses.map((x) => `  • ${x}`),
    `Opportunities:`,
    ...report.swot.opportunities.map((x) => `  • ${x}`),
    `Threats:`,
    ...report.swot.threats.map((x) => `  • ${x}`),
    ``,
    `--- Tech comparison ---`,
    ...report.tech_comparison.map(
      (r) =>
        `${r.area}\n  Yours: ${r.user_stack}\n  Market: ${r.competitor_stack}\n  Note: ${r.advantage}\n`
    ),
    ``,
    `--- Recommendations ---`,
    ...report.recommendations.map((x) => `  • ${x}`),
    ``,
    `--- Devil's advocate ---`,
    ...report.devils_advocate.map((x) => `  • ${x}`),
    ``,
    `--- Extracted / merged content (snippet) ---`,
    report.file_content,
  ];
  return lines.join("\n");
}

export function AnalysisResultModal(props: {
  open: boolean;
  onClose: () => void;
  report: AnalysisReport;
  resultTab: Tab;
  onTabChange: (t: Tab) => void;
  /** If the user just analyzed an upload, offer the same file for download (browser-only; not re-fetched from server). */
  originalUploadedFile?: File | null;
}) {
  const { open, onClose, report, resultTab, onTabChange, originalUploadedFile } = props;

  const downloadJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json;charset=utf-8" });
    const a = document.createElement("a");
    const name = `realeye_${safeFilenamePart(report.title)}_${report.id.slice(0, 8)}.json`;
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [report]);

  const downloadTxt = useCallback(() => {
    const blob = new Blob([buildTextReport(report)], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    const name = `realeye_${safeFilenamePart(report.title)}_${report.id.slice(0, 8)}.txt`;
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [report]);

  const downloadOriginal = useCallback(() => {
    if (!originalUploadedFile) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(originalUploadedFile);
    a.download = originalUploadedFile.name || "upload";
    a.click();
    URL.revokeObjectURL(a.href);
  }, [originalUploadedFile]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close results"
        className="absolute inset-0 bg-zinc-950/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="analysis-result-title"
        className="relative flex max-h-[min(92vh,900px)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/[0.1] bg-zinc-950/95 shadow-2xl shadow-black/60 ring-1 ring-white/[0.08]"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.08] bg-zinc-950/90 px-4 py-3 sm:px-5">
          <p id="analysis-result-title" className="truncate text-sm font-semibold text-white">
            Analysis results
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={downloadJson}
              className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-white/10"
            >
              JSON
            </button>
            <button
              type="button"
              onClick={downloadTxt}
              className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-white/10"
            >
              Text report
            </button>
            {originalUploadedFile ? (
              <button
                type="button"
                onClick={downloadOriginal}
                className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-white/10"
                title={originalUploadedFile.name}
              >
                Original file
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-zinc-900/80 via-zinc-950 to-indigo-950/30 p-5 shadow-xl ring-1 ring-white/[0.05] sm:p-6">
            <div className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full bg-violet-600/15 blur-3xl" />
            <div className="relative mb-6 flex flex-col gap-4 border-b border-white/[0.07] pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-300/80">Your report</p>
                <h2 className="mt-1 font-nacelle text-xl font-bold text-white sm:text-2xl">{report.title}</h2>
                {report.description ? (
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">{report.description}</p>
                ) : null}
              </div>
              <div className="inline-flex shrink-0 rounded-2xl border border-white/10 bg-black/20 p-1.5 shadow-inner">
                <button
                  type="button"
                  onClick={() => onTabChange("overview")}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all sm:px-5 sm:py-2.5 ${
                    resultTab === "overview" ? "bg-white/10 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => onTabChange("strategy")}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all sm:px-5 sm:py-2.5 ${
                    resultTab === "strategy" ? "bg-white/10 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Strategy
                </button>
              </div>
            </div>

            {resultTab === "overview" ? (
              <div className="relative space-y-8">
                <div className="grid gap-6 xl:grid-cols-2">
                  <SimilarityGauge report={report} />
                  <SwotGrid swot={report.swot} />
                </div>
                <TechLensSection report={report} />
                <DevilsAdvocateCard questions={report.devils_advocate} />
                <details className="group rounded-2xl border border-white/[0.07] bg-zinc-950/50 transition-colors open:bg-zinc-900/40">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-zinc-300 [&::-webkit-details-marker]:hidden sm:px-5 sm:py-4">
                    <span className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800/80 text-xs text-zinc-500">
                        &lt;/&gt;
                      </span>
                      Extracted & merged content
                    </span>
                    <svg
                      className="h-5 w-5 shrink-0 text-zinc-500 transition-transform group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="border-t border-white/[0.06] px-4 pb-4 pt-2 sm:px-5 sm:pb-5">
                    <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-xl bg-black/30 p-3 font-mono text-xs leading-relaxed text-zinc-500 sm:max-h-56 sm:p-4">
                      {report.file_content}
                    </pre>
                  </div>
                </details>
              </div>
            ) : (
              <StrategyPanel report={report} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
