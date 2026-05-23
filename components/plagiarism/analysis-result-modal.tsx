"use client";

import { useCallback, useEffect, useState } from "react";
import { SimilarityGauge } from "@/components/plagiarism/similarity-gauge";
import { DevilsAdvocateCard } from "@/components/plagiarism/devils-advocate-card";
import { StrategyPanel } from "@/components/plagiarism/strategy-panel";
import { SwotGrid } from "@/components/plagiarism/swot-grid";
import { TechLensSection } from "@/components/plagiarism/tech-lens-section";
import { CompetitorMap } from "@/components/plagiarism/competitor-map";
import { DocumentHighlightView } from "@/components/plagiarism/document-highlight-view";
import type { AnalysisReport } from "@/types/analysis";
import { API_BASE } from "@/lib/api";

type Tab = "overview" | "strategy";

/** Visible on white modal header (avoid zinc-on-white). */
const headerBtnClass =
  "flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-900";

const headerBtnAccentClass =
  "flex items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-900 shadow-sm transition hover:border-indigo-400 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60";

function safeFilenamePart(s: string) {
  return s
    .trim()
    .replace(/[^\w\- ]+/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 80) || "analysis";
}

function buildTextReport(report: AnalysisReport): string {
  const lines: string[] = [
    `Multi-modal AI Integrity Suite — Analysis report`,
    `═══════════════════════`,
    ``,
    `Title: ${report.title}`,
    ``,
    `Description:`,
    report.description || "(none)",
    ``,
    `Similarity score: ${report.similarity_score}%`,
    report.similarity_label ? `Label: ${report.similarity_label}` : "",
    report.similarity_description ? `How it was computed: ${report.similarity_description}` : "",
    report.similarity_hf_live != null ? `HF live scoring: ${report.similarity_hf_live ? "yes" : "no (fallback)"}` : "",
    report.market_search_snippet
      ? `\n--- Market / web text (comparison) ---\n${report.market_search_snippet}\n`
      : "",
    report.found_projects?.length
      ? `\n--- Similar projects found ---\n${report.found_projects
          .map((p) => `• ${p.name}\n  ${p.snippet}\n  ${p.link}`)
          .join("\n")}\n`
      : "",
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
  return lines.filter((line) => line !== "").join("\n");
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
  const [exportLoading, setExportLoading] = useState<null | "ppt" | "docx">(null);
  const [exportError, setExportError] = useState<string | null>(null);

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

  const downloadServerExport = useCallback(
    async (kind: "ppt" | "docx") => {
      setExportError(null);
      const token = typeof window !== "undefined" ? window.localStorage.getItem("realeye_token") : null;
      if (!token) {
        setExportError("Sign in to export PowerPoint or Word.");
        return;
      }
      const path = kind === "ppt" ? "/api/analyses/export-ppt" : "/api/analyses/export-docx";
      const fallbackExt = kind === "ppt" ? "pptx" : "docx";
      setExportLoading(kind);
      try {
        const res = await fetch(`${API_BASE}${path}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(report),
        });
        if (!res.ok) {
          let msg = `Export failed (${res.status})`;
          try {
            const err = await res.json();
            if (err?.detail) msg = typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail);
          } catch {
            /* ignore */
          }
          setExportError(msg);
          return;
        }
        const blob = await res.blob();
        const cd = res.headers.get("Content-Disposition");
        let filename = `realeye_${safeFilenamePart(report.title)}_${report.id.slice(0, 8)}.${fallbackExt}`;
        const m = cd?.match(/filename="([^"]+)"/);
        if (m?.[1]) filename = m[1];
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
      } catch (e) {
        setExportError(e instanceof Error ? e.message : "Network error");
      } finally {
        setExportLoading(null);
      }
    },
    [report],
  );

  useEffect(() => {
    if (open) setExportError(null);
  }, [open]);

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <button
        type="button"
        aria-label="Close results"
        className="absolute inset-0 bg-slate-900/35 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="analysis-result-title"
        className="relative flex w-full max-h-[94vh] max-w-7xl flex-col overflow-hidden rounded-3xl border border-indigo-100 bg-white/95 backdrop-blur-2xl shadow-2xl shadow-indigo-100 ring-1 ring-indigo-100"
      >
        <div className="sticky top-0 z-20 shrink-0 border-b border-indigo-100 bg-white/90 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
            <div className="min-w-0 flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 ring-1 ring-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <svg className="h-5 w-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Intelligence Report</p>
                <p id="analysis-result-title" className="truncate text-base font-semibold text-slate-900">
                  {report.title}
                </p>
              </div>
            </div>
            <div className="flex min-w-0 flex-[1_1_auto] flex-wrap items-center justify-end gap-2 sm:gap-3">
              <button type="button" onClick={downloadJson} className={`${headerBtnClass} group`}>
                <span>JSON</span>
              </button>
              <button type="button" onClick={downloadTxt} className={`${headerBtnClass} group`}>
                <span>Text</span>
              </button>
              {originalUploadedFile ? (
                <button
                  type="button"
                  onClick={downloadOriginal}
                  className={`${headerBtnClass} group`}
                  title={originalUploadedFile.name}
                >
                  <span>Original</span>
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => void downloadServerExport("ppt")}
                disabled={exportLoading !== null}
                title="Generate .pptx from this report (server)"
                className={headerBtnAccentClass}
              >
                <span>{exportLoading === "ppt" ? "PPT…" : "Generate PPT"}</span>
              </button>
              <button
                type="button"
                onClick={() => void downloadServerExport("docx")}
                disabled={exportLoading !== null}
                title="Generate .docx from this report (server)"
                className={headerBtnAccentClass}
              >
                <span>{exportLoading === "docx" ? "Word…" : "Generate Word"}</span>
              </button>
              {exportError ? (
                <span className="max-w-[min(16rem,40vw)] truncate text-[11px] font-medium text-red-600" title={exportError}>
                  {exportError}
                </span>
              ) : null}
              <div className="mx-1 h-6 w-px shrink-0 bg-slate-200" aria-hidden />
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                aria-label="Close"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-8 sm:py-8">
          <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-b from-white to-indigo-50/50 p-5 shadow-xl ring-1 ring-indigo-100 sm:p-8">
            <div className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-violet-600/10 blur-[80px]" />
            <div className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-indigo-600/10 blur-[80px]" />
            
            <div className="relative mb-8 flex flex-col gap-6 border-b border-white/[0.06] pb-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="inline-flex mb-3 items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-60"></span>
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
                  </span>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300">Your Report</p>
                </div>
                <h2 className="font-nacelle text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{report.title}</h2>
                {report.description ? (
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-400">{report.description}</p>
                ) : null}
              </div>
              
              <div className="relative inline-flex shrink-0 rounded-2xl border border-white/10 bg-white/5 p-1.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => onTabChange("overview")}
                  className={`relative z-10 flex min-w-[110px] items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
                    resultTab === "overview" ? "text-white text-shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {resultTab === "overview" && (
                    <span className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.4)]" />
                  )}
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => onTabChange("strategy")}
                  className={`relative z-10 flex min-w-[110px] items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
                    resultTab === "strategy" ? "text-white text-shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {resultTab === "strategy" && (
                    <span className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 shadow-[0_0_20px_rgba(124,58,237,0.4)]" />
                  )}
                  Strategy
                </button>
              </div>
            </div>

            {resultTab === "overview" ? (
              <div className="relative space-y-8">
                <div className="grid gap-6 2xl:grid-cols-2">
                  <SimilarityGauge report={report} />
                  <SwotGrid swot={report.swot} />
                </div>
                <CompetitorMap
                  data={report.competitor_map ?? []}
                  companyName={report.company_name?.trim() || report.title}
                />
                <TechLensSection report={report} />
                <DevilsAdvocateCard questions={report.devils_advocate} />
                <section className="rounded-2xl border border-amber-500/25 bg-gradient-to-b from-amber-500/5 to-zinc-950/40">
                  <div className="border-b border-amber-500/15 px-5 py-4 sm:px-6">
                    <h3 className="text-sm font-semibold text-amber-100">Uploaded document</h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      Similar papers, downloads, and overlap with your file — not shown in the competitor
                      list above.
                    </p>
                  </div>
                  <div className="px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
                    <DocumentHighlightView
                      report={report}
                      originalUploadedFile={originalUploadedFile}
                    />
                  </div>
                </section>
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
