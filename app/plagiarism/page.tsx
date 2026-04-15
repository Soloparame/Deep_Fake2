"use client";

import { FormEvent, useCallback, useEffect, useState, useRef, type DragEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnalysisHistorySidebar } from "@/components/plagiarism/analysis-history-sidebar";
import { AnalysisResultModal } from "@/components/plagiarism/analysis-result-modal";
import type { AnalysisListItem, AnalysisReport } from "@/types/analysis";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const ACCEPT_FILES =
  ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const inputClass =
  "mt-2 w-full rounded-xl border border-white/[0.08] bg-zinc-900/40 px-4 py-3 text-sm text-zinc-100 shadow-inner shadow-black/20 placeholder:text-zinc-600 transition-all focus:border-indigo-500/40 focus:bg-zinc-900/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

const labelClass = "flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500";

function authHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const t = window.localStorage.getItem("realeye_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export default function PlagiarismPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"paste" | "upload">("paste");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [myTechStack, setMyTechStack] = useState("");
  const [pastedContent, setPastedContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  /** Last file that was successfully submitted (for “download original” in the modal). */
  const [lastSubmittedFile, setLastSubmittedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [resultTab, setResultTab] = useState<"overview" | "strategy">("overview");
  const [resultModalOpen, setResultModalOpen] = useState(false);

  const [historyLoading, setHistoryLoading] = useState(true);
  const [history, setHistory] = useState<AnalysisListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(false);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/analyses`, { headers: authHeaders() });
      if (res.status === 401) {
        setHistory([]);
        return;
      }
      if (!res.ok) throw new Error("Could not load history");
      const data = await res.json();
      setHistory(data.analyses ?? []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    const onAuth = () => {
      setHasToken(!!window.localStorage.getItem("realeye_token"));
      loadHistory();
    };
    onAuth();
    window.addEventListener("auth-change", onAuth);
    return () => window.removeEventListener("auth-change", onAuth);
  }, [loadHistory]);

  const hasInput =
    title.trim().length > 0 &&
    (mode === "paste" ? pastedContent.trim().length > 0 || description.trim().length > 0 : file !== null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Please enter a project title.");
      return;
    }
    if (mode === "paste" && !pastedContent.trim() && !description.trim()) {
      setError("Add a description or paste your document text.");
      return;
    }
    if (mode === "upload" && !file) {
      setError("Please choose a PDF or Word document.");
      return;
    }
    const token = typeof window !== "undefined" ? window.localStorage.getItem("realeye_token") : null;
    if (!token) {
      setError("Please sign in to run analyses and save them to your account.");
      router.push("/signin");
      return;
    }

    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("description", description);
    fd.append("my_tech_stack", myTechStack);
    fd.append("pasted_content", mode === "paste" ? pastedContent : "");
    if (mode === "upload" && file) fd.append("file", file);

    setLoading(true);
    setReport(null);
    setSelectedId(null);
    setResultModalOpen(false);
    setLastSubmittedFile(null);
    try {
      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: authHeaders(),
        body: fd,
      });
      const text = await res.text();
      let data: unknown = null;
      try {
        data = JSON.parse(text);
      } catch {
        /* ignore */
      }
      if (!res.ok) {
        const detail =
          typeof data === "object" && data !== null && "detail" in data
            ? String((data as { detail: unknown }).detail)
            : text || res.statusText;
        throw new Error(detail);
      }
      setReport(data as AnalysisReport);
      setResultTab("overview");
      setResultModalOpen(true);
      if (mode === "upload" && file) setLastSubmittedFile(file);
      else setLastSubmittedFile(null);
      await loadHistory();
      setSelectedId((data as AnalysisReport).id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const loadAnalysisById = async (id: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/analyses/${encodeURIComponent(id)}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Could not open this analysis.");
      const data = (await res.json()) as AnalysisReport;
      setReport(data);
      setSelectedId(id);
      setResultTab("overview");
      setResultModalOpen(true);
      setLastSubmittedFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analysis.");
    } finally {
      setLoading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startNewIntel = () => {
    setError(null);
    setReport(null);
    setSelectedId(null);
    setResultModalOpen(false);
    setLastSubmittedFile(null);
    // Keep user inputs so they can append/update quickly without retyping everything.
  };

  const onDropFile = (e: DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    const ok =
      f.type === "application/pdf" ||
      f.type === "application/msword" ||
      f.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      /\.pdf$/i.test(f.name) ||
      /\.docx?$/i.test(f.name);
    if (!ok) {
      setError("Please use a PDF, DOC, or DOCX file.");
      return;
    }
    setError(null);
    setFile(f);
  };

  return (
    <section className="relative min-h-[calc(100vh-80px)] overflow-hidden py-10 sm:py-14">
      {/* Ambient + grid */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_50%,transparent)]" />
        <div className="absolute left-[10%] top-[10%] h-[420px] w-[420px] rounded-full bg-indigo-600/[0.12] blur-[120px]" />
        <div className="absolute right-[5%] top-[40%] h-[320px] w-[320px] rounded-full bg-violet-600/[0.1] blur-[100px]" />
        <div className="absolute bottom-[5%] left-1/3 h-[240px] w-[240px] rounded-full bg-fuchsia-600/[0.06] blur-[90px]" />
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        {/* Hero */}
        <div className="mb-10 text-center sm:mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-indigo-200/90 shadow-lg shadow-indigo-950/20 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-400" />
            </span>
            Analysis dashboard
          </div>
          <h1 className="font-nacelle text-4xl font-bold tracking-tight text-white drop-shadow-sm sm:text-5xl">
            <span className="bg-gradient-to-r from-indigo-200 via-white to-violet-200 bg-clip-text text-transparent">
              Project Intel
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            Similarity intelligence, competitor discovery, SWOT, tech comparison, strategy, and defense prep — in one refined report.
          </p>
          {!hasToken && (
            <div className="mx-auto mt-6 max-w-lg rounded-2xl border border-amber-500/25 bg-amber-950/30 px-4 py-3 text-sm text-amber-100/90">
              <span className="font-medium text-amber-200">Sign in required</span> to run analyses and save history to your MongoDB account.{" "}
              <Link href="/signin" className="font-semibold text-indigo-300 underline-offset-2 hover:underline">
                Sign in
              </Link>{" "}
              or{" "}
              <Link href="/signup" className="font-semibold text-indigo-300 underline-offset-2 hover:underline">
                create an account
              </Link>
              .
            </div>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(260px,288px)_1fr] lg:items-start lg:gap-10">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <AnalysisHistorySidebar
              items={history}
              loading={historyLoading}
              selectedId={selectedId}
              onSelect={(id) => loadAnalysisById(id)}
            />
          </div>

          <div className="min-w-0 space-y-10">
            <form
              onSubmit={handleSubmit}
              className="group/form relative overflow-hidden rounded-3xl border border-white/[0.09] bg-gradient-to-b from-zinc-900/90 via-zinc-950/95 to-zinc-950 shadow-2xl shadow-black/50 ring-1 ring-white/[0.06]"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
              <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl transition-opacity group-hover/form:opacity-100" />
              <div className="relative p-6 sm:p-8">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/25 to-violet-600/20 ring-1 ring-indigo-400/30">
                      <svg className="h-6 w-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">New analysis</h2>
                      <p className="mt-0.5 text-sm text-zinc-500">Describe your project and add text or a document.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={startNewIntel}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add new info
                  </button>
                </div>

                <div className="mb-8 flex rounded-2xl border border-white/[0.07] bg-zinc-950/60 p-1.5 shadow-inner">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("paste");
                      setError(null);
                    }}
                    className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all ${
                      mode === "paste"
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-900/40"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <svg className="h-4 w-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Paste text
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("upload");
                      setError(null);
                    }}
                    className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all ${
                      mode === "upload"
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-900/40"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <svg className="h-4 w-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload file
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <label htmlFor="plag-title" className={labelClass}>
                      <span className="h-1 w-1 rounded-full bg-indigo-400" />
                      Title
                    </label>
                    <input
                      id="plag-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Project or thesis title"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="plag-desc" className={labelClass}>
                      <span className="h-1 w-1 rounded-full bg-violet-400" />
                      Description
                    </label>
                    <textarea
                      id="plag-desc"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Goals, scope, audience — a short summary helps the report."
                      rows={3}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="plag-tech" className={labelClass}>
                      <span className="h-1 w-1 rounded-full bg-fuchsia-400/80" />
                      My tech stack
                      <span className="font-normal normal-case tracking-normal text-zinc-600">(optional)</span>
                    </label>
                    <input
                      id="plag-tech"
                      value={myTechStack}
                      onChange={(e) => setMyTechStack(e.target.value)}
                      placeholder="e.g. Next.js, FastAPI, MongoDB"
                      className={inputClass}
                    />
                  </div>

                  {mode === "paste" ? (
                    <div>
                      <label htmlFor="plag-paste" className={labelClass}>
                        <span className="h-1 w-1 rounded-full bg-sky-400/90" />
                        Document text
                      </label>
                      <textarea
                        id="plag-paste"
                        value={pastedContent}
                        onChange={(e) => setPastedContent(e.target.value)}
                        placeholder="Paste chapters, proposal text, or notes…"
                        rows={10}
                        className={`${inputClass} min-h-[220px]`}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className={labelClass}>
                        <span className="h-1 w-1 rounded-full bg-sky-400/90" />
                        Document
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPT_FILES}
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0] ?? null;
                          setFile(f);
                          setError(null);
                        }}
                      />
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => fileInputRef.current?.click()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={onDropFile}
                        className={`group/dz relative mt-2 flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed px-6 py-14 transition-all duration-300 ${
                          file
                            ? "border-indigo-500/45 bg-indigo-500/[0.07] shadow-[inset_0_0_40px_-10px_rgba(99,102,241,0.25)]"
                            : "border-white/[0.1] bg-zinc-900/30 hover:border-indigo-500/35 hover:bg-zinc-900/50"
                        }`}
                      >
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.08),transparent_70%)] opacity-0 transition-opacity group-hover/dz:opacity-100" />
                        {file ? (
                          <>
                            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/20 ring-1 ring-indigo-400/30">
                              <svg className="h-7 w-7 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <p className="relative font-medium text-white">{file.name}</p>
                            <p className="relative mt-1 text-sm text-zinc-500">{(file.size / 1024).toFixed(1)} KB</p>
                            <button
                              type="button"
                              onClick={(ev) => {
                                ev.stopPropagation();
                                clearFile();
                              }}
                              className="relative mt-4 text-xs font-medium text-indigo-400 underline-offset-4 hover:text-indigo-300 hover:underline"
                            >
                              Remove file
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-zinc-900/80 shadow-lg">
                              <svg className="h-8 w-8 text-zinc-500 transition-colors group-hover/dz:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                            </div>
                            <p className="relative text-sm font-medium text-zinc-300">Drop PDF or DOCX here</p>
                            <p className="relative mt-1 text-xs text-zinc-600">or click to browse · legacy .doc not supported</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-500/25 bg-red-950/40 px-4 py-3 text-sm text-red-300 shadow-lg shadow-red-950/20">
                    <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-white/[0.06] pt-6">
                  <button
                    type="submit"
                    disabled={!hasInput || loading}
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-900/30 transition-all hover:shadow-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-40 sm:min-w-[200px]"
                  >
                    {loading ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Analyzing…
                      </>
                    ) : (
                      <>
                        Run analysis
                        <svg
                          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {report && (
              <>
                <AnalysisResultModal
                  open={resultModalOpen}
                  onClose={() => setResultModalOpen(false)}
                  report={report}
                  resultTab={resultTab}
                  onTabChange={setResultTab}
                  originalUploadedFile={lastSubmittedFile}
                />
                {!resultModalOpen && (
                  <div className="flex flex-col gap-3 rounded-2xl border border-indigo-500/25 bg-indigo-950/35 px-4 py-4 shadow-lg shadow-indigo-950/20 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <p className="text-sm text-zinc-200">
                      <span className="font-medium text-indigo-200">Report ready:</span> {report.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={startNewIntel}
                        className="shrink-0 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-white/10 hover:text-white"
                      >
                        Add new info
                      </button>
                      <button
                        type="button"
                        onClick={() => setResultModalOpen(true)}
                        className="shrink-0 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:shadow-indigo-500/20"
                      >
                        Open results
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
