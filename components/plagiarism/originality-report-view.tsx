"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  AnalysisReport,
  HighlightSegmentItem,
  PlagiarismSourceItem,
} from "@/types/analysis";

const TYPE_COLORS: Record<string, { bg: string; text: string; label: string; badge: string }> = {
  database: { bg: "bg-red-100", text: "text-red-900", label: "Student Paper", badge: "bg-red-600" },
  online: { bg: "bg-blue-100", text: "text-blue-900", label: "Internet Source", badge: "bg-blue-600" },
  publication: { bg: "bg-green-100", text: "text-green-900", label: "Publication", badge: "bg-green-600" },
};

function safeFilenamePart(s: string) {
  return s.trim().replace(/[^\w\- ]+/g, "").replace(/\s+/g, "_").slice(0, 60) || "document";
}

function stripNotice(content: string): string {
  if (content.startsWith("ℹ️")) {
    return content.split("\n\n").slice(1).join("\n\n").trim() || content;
  }
  return content;
}

function buildSegmentsFromReport(report: AnalysisReport): HighlightSegmentItem[] {
  if (report.highlighted_segments?.length) {
    return report.highlighted_segments;
  }
  const content = stripNotice(report.file_content);
  return [{ segment: content, is_plagiarized: false, start_index: 0, end_index: content.length }];
}

function buildSources(report: AnalysisReport): PlagiarismSourceItem[] {
  const fromPlag = report.plagiarism_sources ?? [];
  if (fromPlag.length) return fromPlag;

  const seen = new Set<string>();
  const out: PlagiarismSourceItem[] = [];
  for (const d of report.similar_documents ?? []) {
    if (!d.id || seen.has(d.id)) continue;
    seen.add(d.id);
    out.push({
      type:
        d.source === "bahirdar_documents"
          ? "database"
          : d.source === "semantic_scholar" || d.source === "arxiv"
            ? "publication"
            : "online",
      id: d.id,
      title: d.title,
      link: d.url?.startsWith("bahirdar://") ? "" : d.url,
      similarity_percent: d.similarity_percent ?? 0,
    });
  }
  return out;
}

type Props = {
  report: AnalysisReport;
  originalUploadedFile?: File | null;
};

export function OriginalityReportView({ report, originalUploadedFile }: Props) {
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null);

  const summary = report.plagiarism_summary;
  const sources = useMemo(() => buildSources(report), [report]);
  const segments = useMemo(() => buildSegmentsFromReport(report), [report]);

  const dbSources = sources.filter((s) => s.type === "database");
  const webSources = sources.filter((s) => s.type === "online");
  const pubSources = sources.filter((s) => s.type === "publication");

  const similarityIndex = summary?.total_plagiarism_percent ?? report.similarity_score ?? 0;
  const studentPct = dbSources.length ? Math.max(...dbSources.map((s) => s.similarity_percent)) : 0;
  const internetPct = webSources.length ? Math.max(...webSources.map((s) => s.similarity_percent)) : 0;
  const pubPct = pubSources.length ? Math.max(...pubSources.map((s) => s.similarity_percent)) : 0;

  const baseName = useMemo(
    () => `realeye_${safeFilenamePart(report.title)}_${(report.id || "").slice(0, 8)}`,
    [report.title, report.id],
  );

  const downloadOriginal = useCallback(() => {
    if (!originalUploadedFile) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(originalUploadedFile);
    a.download = originalUploadedFile.name || "upload";
    a.click();
    URL.revokeObjectURL(a.href);
  }, [originalUploadedFile]);

  const visibleSegments = useMemo(() => {
    if (!activeSourceId) return segments;
    return segments.map((seg) =>
      seg.is_plagiarized && seg.source_id !== activeSourceId
        ? { ...seg, is_plagiarized: false, color: "", source_title: "", similarity: 0 }
        : seg,
    );
  }, [segments, activeSourceId]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white text-slate-800 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
        <h2 className="text-sm font-semibold text-slate-900">{report.title}</h2>
        <div className="flex items-center gap-2">
          {originalUploadedFile ? (
            <button
              type="button"
              onClick={downloadOriginal}
              className="rounded border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
            >
              Original file
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 border-b border-slate-200 px-5 py-6 sm:grid-cols-4">
        <MetricCell label="Similarity Index" value={similarityIndex} highlight={similarityIndex > 0} />
        <MetricCell label="Internet Sources" value={internetPct} />
        <MetricCell label="Publications" value={pubPct} />
        <MetricCell label="Student Papers" value={studentPct} highlight={studentPct > 0} />
      </div>

      <div className="grid gap-0 lg:grid-cols-[1fr_280px]">
        <div className="min-w-0 border-b border-slate-200 lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-200 px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-red-600">Primary Sources</p>
            <SourceGroup label="Student Papers (Database)" sources={dbSources} activeId={activeSourceId} onSelect={setActiveSourceId} emptyHint="No corpus matches — add more files to bahirdar_documents." />
            <SourceGroup label="Internet (DuckDuckGo)" sources={webSources} activeId={activeSourceId} onSelect={setActiveSourceId} emptyHint="No web results — check network or try a longer document." />
            <SourceGroup label="Publications (Semantic Scholar)" sources={pubSources} activeId={activeSourceId} onSelect={setActiveSourceId} emptyHint="No papers found — set SEMANTIC_SCHOLAR_API_KEY in .env." />
          </div>

          <div className="px-5 py-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Your document — highlighted matches
            </p>
            <div className="max-h-[32rem] overflow-y-auto rounded border border-slate-200 bg-white p-4 font-serif text-sm leading-relaxed text-slate-800">
              {visibleSegments.map((seg, i) => (
                <SegmentSpan key={`${seg.start_index}-${i}`} seg={seg} />
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-red-200" /> Database</span>
              <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-blue-200" /> Online</span>
              <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-green-200" /> Publication</span>
            </div>
          </div>
        </div>

        <aside className="px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">All sources (6 max)</p>
          <p className="mt-1 text-[11px] text-slate-400">Click a source to filter highlights</p>
          <button
            type="button"
            onClick={() => setActiveSourceId(null)}
            className={`mt-3 w-full rounded border px-2 py-1.5 text-left text-[11px] ${!activeSourceId ? "border-slate-400 bg-slate-100 font-semibold" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >
            Show all matches
          </button>
          <ul className="mt-3 space-y-2">
            {sources.map((src, idx) => (
              <SourcePanelItem
                key={src.id}
                src={src}
                num={idx + 1}
                active={activeSourceId === src.id}
                onClick={() => setActiveSourceId(activeSourceId === src.id ? null : src.id)}
              />
            ))}
          </ul>
          {summary ? (
            <p className="mt-4 text-[11px] text-slate-500">
              {summary.db_matches} DB · {summary.web_matches} web · {summary.pub_matches} pub
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function SegmentSpan({ seg }: { seg: HighlightSegmentItem }) {
  if (!seg.is_plagiarized) {
    return <span className="whitespace-pre-wrap">{seg.segment}</span>;
  }
  const colors = TYPE_COLORS[seg.source_type || "database"] ?? TYPE_COLORS.database;
  const title = `Match found in ${seg.source_title || "source"} — ${seg.similarity ?? 0}% similarity`;
  return (
    <mark
      className={`${colors.bg} ${colors.text} cursor-help rounded-sm px-0.5`}
      title={title}
    >
      {seg.segment}
    </mark>
  );
}

function SourceGroup({
  label,
  sources,
  activeId,
  onSelect,
  emptyHint,
}: {
  label: string;
  sources: PlagiarismSourceItem[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
  emptyHint?: string;
}) {
  return (
    <div className="mt-4">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
        {label} ({sources.length}/2)
      </p>
      {sources.length === 0 ? (
        <p className="mt-2 text-xs text-slate-400">{emptyHint ?? "No matches found for this category."}</p>
      ) : (
        <ul className="mt-2 divide-y divide-slate-100">
          {sources.map((src) => {
            const colors = TYPE_COLORS[src.type] ?? TYPE_COLORS.database;
            return (
              <li key={src.id}>
                <button
                  type="button"
                  onClick={() => onSelect(activeId === src.id ? null : src.id)}
                  className={`flex w-full items-start gap-3 py-2.5 text-left transition ${activeId === src.id ? "bg-slate-50" : "hover:bg-slate-50/80"}`}
                >
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-[10px] font-bold text-white ${colors.badge}`}>
                    {src.type === "database" ? "D" : src.type === "online" ? "W" : "P"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-slate-800 line-clamp-2">{src.title}</span>
                    <span className="text-[10px] text-slate-500">{colors.label}</span>
                  </span>
                  <span className="shrink-0 text-sm text-slate-700">{src.similarity_percent}%</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SourcePanelItem({
  src,
  num,
  active,
  onClick,
}: {
  src: PlagiarismSourceItem;
  num: number;
  active: boolean;
  onClick: () => void;
}) {
  const colors = TYPE_COLORS[src.type] ?? TYPE_COLORS.database;
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`w-full rounded-lg border px-3 py-2.5 text-left transition ${active ? "border-slate-400 bg-slate-100 shadow-sm" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}
      >
        <div className="flex items-center gap-2">
          <span className={`flex h-5 w-5 shrink-0 items-center justify-center text-[10px] font-bold text-white ${colors.badge}`}>
            {num}
          </span>
          <span className="text-xs font-semibold text-slate-800 line-clamp-2">{src.title}</span>
        </div>
        <p className="mt-1 pl-7 text-[10px] text-slate-500">{colors.label} · {src.similarity_percent}%</p>
        {src.link && src.link.startsWith("http") ? (
          <a
            href={src.link}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-1 block pl-7 text-[10px] text-indigo-600 hover:underline truncate"
          >
            Open ↗
          </a>
        ) : null}
      </button>
    </li>
  );
}

function MetricCell({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div>
      <p className={`text-3xl font-light tracking-tight ${highlight && value > 0 ? "text-red-600" : "text-slate-800"}`}>
        {Math.round(value * 10) / 10}%
      </p>
      <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.1em] text-slate-500">{label}</p>
    </div>
  );
}
