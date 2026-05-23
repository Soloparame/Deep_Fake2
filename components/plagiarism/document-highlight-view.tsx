"use client";

import { useCallback, useMemo } from "react";
import type { AnalysisReport, DocumentMatchItem, SimilarDocumentItem } from "@/types/analysis";

type Segment =
  | { kind: "plain"; text: string }
  | { kind: "match"; text: string; match: DocumentMatchItem };

function safeFilenamePart(s: string) {
  return s
    .trim()
    .replace(/[^\w\- ]+/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 60) || "document";
}

function buildSegments(content: string, matches: DocumentMatchItem[]): Segment[] {
  if (!matches.length) return [{ kind: "plain", text: content }];
  const sorted = [...matches]
    .filter((m) => m.user_end > m.user_start && m.user_start >= 0 && m.user_end <= content.length)
    .sort((a, b) => a.user_start - b.user_start);
  const segments: Segment[] = [];
  let pos = 0;
  for (const m of sorted) {
    if (m.user_start < pos) continue;
    if (m.user_start > pos) segments.push({ kind: "plain", text: content.slice(pos, m.user_start) });
    segments.push({ kind: "match", text: content.slice(m.user_start, m.user_end), match: m });
    pos = m.user_end;
  }
  if (pos < content.length) segments.push({ kind: "plain", text: content.slice(pos) });
  return segments.length ? segments : [{ kind: "plain", text: content }];
}

function buildHighlightedTxt(report: AnalysisReport): string {
  const matches = report.document_matches ?? [];
  const segments = buildSegments(report.file_content, matches);
  const lines: string[] = [
    `RealEye — Highlighted document report`,
    `Project: ${report.title}`,
    ``,
    `--- Your document (marked passages) ---`,
    ``,
  ];
  for (const seg of segments) {
    if (seg.kind === "plain") {
      lines.push(seg.text);
      continue;
    }
    const m = seg.match;
    lines.push(
      `\n[[ SIMILAR ${m.similarity}% | ${m.source_title} | ${m.source_url} ]]\n${seg.text}\n[[ /SIMILAR ]]\n`
    );
  }
  const docs = report.similar_documents ?? [];
  if (docs.length) {
    lines.push(`\n\n--- Similar documents (Semantic Scholar & web PDF) ---\n`);
    for (const d of docs) {
      lines.push(`• ${d.title}`);
      lines.push(`  ${d.url}`);
      if (d.s2_url) lines.push(`  Semantic Scholar: ${d.s2_url}`);
      lines.push(`  ${d.snippet}\n`);
    }
  }
  if (matches.length) {
    lines.push(`\n--- Match index ---\n`);
    matches.forEach((m, i) => {
      lines.push(
        `${i + 1}. ${m.similarity}% — ${m.source_title}\n   ${m.source_url}\n   "${m.matched_text.slice(0, 200)}..."`
      );
    });
  }
  return lines.join("\n");
}

function buildHighlightedHtml(report: AnalysisReport): string {
  const matches = report.document_matches ?? [];
  const segments = buildSegments(report.file_content, matches);
  const bodyParts: string[] = [];
  for (const seg of segments) {
    if (seg.kind === "plain") {
      bodyParts.push(
        `<span>${seg.text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")}</span>`
      );
    } else {
      const m = seg.match;
      const escaped = seg.text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>");
      bodyParts.push(
        `<mark style="background:#fde68a;color:#1c1917;padding:0 2px;border-radius:2px" title="${m.similarity}% — ${m.source_title}"><a href="${m.source_url}" style="color:inherit">${escaped}</a></mark>`
      );
    }
  }
  const docs = report.similar_documents ?? [];
  const sourcesList = docs
    .map(
      (d) =>
        `<li><strong>${d.title}</strong> — <a href="${d.url}">${d.url}</a>${d.s2_url ? ` · <a href="${d.s2_url}">Semantic Scholar</a>` : ""}</li>`
    )
    .join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${report.title} — Highlighted</title>
<style>body{font-family:Georgia,serif;max-width:48rem;margin:2rem auto;padding:0 1rem;line-height:1.6;color:#1e293b}
h1{font-size:1.25rem} .sources{margin-top:2rem;padding-top:1rem;border-top:1px solid #e2e8f0;font-size:.9rem}</style></head>
<body><h1>${report.title}</h1><p style="color:#64748b;font-size:.875rem">Highlighted passages link to similar academic documents.</p>
<div>${bodyParts.join("")}</div>
${sourcesList ? `<div class="sources"><h2>Similar documents</h2><ul>${sourcesList}</ul></div>` : ""}
</body></html>`;
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

type Props = {
  report: AnalysisReport;
  originalUploadedFile?: File | null;
};

export function DocumentHighlightView({ report, originalUploadedFile }: Props) {
  const matches = report.document_matches ?? [];
  const similarDocuments = report.similar_documents ?? [];

  const baseName = useMemo(
    () => `realeye_${safeFilenamePart(report.title)}_${(report.id || "").slice(0, 8)}`,
    [report.title, report.id]
  );

  const downloadHighlightedTxt = useCallback(() => {
    downloadBlob(buildHighlightedTxt(report), `${baseName}_highlighted.txt`, "text/plain;charset=utf-8");
  }, [report, baseName]);

  const downloadHighlightedHtml = useCallback(() => {
    downloadBlob(buildHighlightedHtml(report), `${baseName}_highlighted.html`, "text/html;charset=utf-8");
  }, [report, baseName]);

  const downloadPlainDocument = useCallback(() => {
    downloadBlob(report.file_content, `${baseName}_document.txt`, "text/plain;charset=utf-8");
  }, [report.file_content, baseName]);

  const downloadOriginal = useCallback(() => {
    if (!originalUploadedFile) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(originalUploadedFile);
    a.download = originalUploadedFile.name || "upload";
    a.click();
    URL.revokeObjectURL(a.href);
  }, [originalUploadedFile]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={downloadHighlightedTxt}
          className="rounded-xl border border-amber-400/40 bg-amber-500/15 px-4 py-2 text-xs font-semibold text-amber-100 transition hover:bg-amber-500/25"
        >
          Download highlighted (.txt)
        </button>
        <button
          type="button"
          onClick={downloadHighlightedHtml}
          className="rounded-xl border border-amber-400/40 bg-amber-500/15 px-4 py-2 text-xs font-semibold text-amber-100 transition hover:bg-amber-500/25"
        >
          Download highlighted (.html)
        </button>
        <button
          type="button"
          onClick={downloadPlainDocument}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/10"
        >
          Download document text
        </button>
        {originalUploadedFile ? (
          <button
            type="button"
            onClick={downloadOriginal}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/10"
          >
            Download original file
          </button>
        ) : null}
      </div>

      <section className="rounded-xl border border-indigo-500/25 bg-indigo-500/5 p-4 sm:p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-200">
          Similar documents
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          From Semantic Scholar and web PDF search — related papers to your uploaded content.
        </p>
        {similarDocuments.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-400">
            No similar documents found for this run. Try a longer upload and ensure your Semantic Scholar API
            key is set.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {similarDocuments.map((doc) => (
              <SimilarDocumentRow key={doc.id} doc={doc} matchCount={matches.filter((m) => m.source_document_id === doc.id).length} />
            ))}
          </ul>
        )}
      </section>

      {report.file_content.startsWith("ℹ️") ? (
        <p className="rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-100/90">
          {report.file_content.split("\n\n")[0].replace(/^ℹ️\s*/, "")}
        </p>
      ) : null}

      {matches.length > 0 ? (
        <section className="rounded-xl border border-white/5 bg-zinc-900/40 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">
            Flagged passages ({matches.length})
          </p>
          <ul className="mt-3 space-y-2">
            {matches.map((m, idx) => (
              <li
                key={`${m.user_start}-${idx}`}
                className="rounded-lg border border-white/5 bg-black/30 px-3 py-2.5 text-xs"
              >
                <span className="font-semibold text-amber-300">{m.similarity}%</span>
                <span className="text-zinc-500"> — </span>
                <a
                  href={m.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-300 hover:underline"
                >
                  {m.source_title}
                </a>
                <p className="mt-1 line-clamp-2 text-zinc-400">&ldquo;{m.matched_text}&rdquo;</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function SimilarDocumentRow({ doc, matchCount }: { doc: SimilarDocumentItem; matchCount: number }) {
  const sourceLabel =
    doc.source === "semantic_scholar_recommendation"
      ? "Semantic Scholar · recommended"
      : doc.source === "semantic_scholar"
        ? "Semantic Scholar"
        : doc.source === "arxiv"
          ? "arXiv"
          : doc.source === "duckduckgo_pdf"
            ? "Web PDF"
            : "Document";

  return (
    <li className="rounded-xl border border-white/10 bg-black/35 px-4 py-3">
      <p className="text-sm font-semibold text-white">{doc.title}</p>
      <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{doc.snippet}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-zinc-500">
        <span>{sourceLabel}</span>
        {doc.year ? <span>{doc.year}</span> : null}
        {doc.is_open_access ? <span className="text-emerald-400/90">Open access</span> : null}
        {matchCount > 0 ? <span className="text-amber-300/90">{matchCount} flagged passage(s)</span> : null}
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold">
        <a href={doc.url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
          {doc.document_type === "pdf" ? "Open PDF" : "Open document"} ↗
        </a>
        {doc.s2_url ? (
          <a href={doc.s2_url} target="_blank" rel="noreferrer" className="text-indigo-400/80 hover:underline">
            Semantic Scholar ↗
          </a>
        ) : null}
      </div>
    </li>
  );
}
