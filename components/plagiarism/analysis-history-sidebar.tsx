"use client";

import type { AnalysisListItem } from "@/types/analysis";

type Props = {
  items: AnalysisListItem[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void | Promise<void>;
};

export function AnalysisHistorySidebar({ items, loading, selectedId, onSelect, onDelete }: Props) {
  return (
    <aside className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-b from-white to-indigo-50/35 p-5 shadow-xl shadow-indigo-100/60 ring-1 ring-indigo-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
      <div className="mb-5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 ring-1 ring-indigo-400/25">
            <svg className="h-4 w-4 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-600">History</h2>
            <p className="text-[11px] text-slate-500">Saved runs</p>
          </div>
        </div>
        {items.length > 0 && (
          <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[10px] font-semibold text-zinc-500">
            {items.length}
          </span>
        )}
      </div>

      {loading ? (
        <ul className="space-y-3">
          {[1, 2, 3].map((i) => (
            <li key={i} className="h-16 animate-pulse rounded-2xl bg-zinc-800/60" />
          ))}
        </ul>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/[0.08] bg-zinc-950/50 px-4 py-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/5 bg-zinc-900/80">
            <svg className="h-6 w-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-zinc-500">No analyses yet</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-600">Run your first check — it will appear here.</p>
        </div>
      ) : (
        <ul className="max-h-[min(70vh,520px)] space-y-2 overflow-y-auto pr-1">
          {items.map((a) => {
            const active = selectedId === a.id;
            return (
              <li key={a.id}>
                <div
                  className={`group relative w-full overflow-hidden rounded-2xl border px-3.5 py-3 text-left transition-all ${
                    active
                      ? "border-indigo-300 bg-gradient-to-r from-indigo-50 to-violet-50 shadow-sm"
                      : "border-indigo-100 bg-white/80 hover:border-indigo-200 hover:bg-indigo-50/50"
                  }`}
                >
                  <span
                    className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-full transition-colors ${
                      active ? "bg-gradient-to-b from-indigo-400 to-violet-500" : "bg-transparent group-hover:bg-zinc-600"
                    }`}
                  />
                  <div className="flex items-start gap-2">
                    <button type="button" onClick={() => onSelect(a.id)} className="min-w-0 flex-1 text-left">
                      <span className={`line-clamp-2 pl-1 text-sm font-medium ${active ? "text-slate-900" : "text-slate-700"}`}>
                        {a.title}
                      </span>
                      <span className="mt-2 flex items-center justify-between pl-1 text-[11px] text-zinc-500">
                        <span className="inline-flex items-center gap-1 rounded-md bg-black/25 px-1.5 py-0.5 font-mono text-zinc-400">
                          {Math.round(a.similarity_score)}% match
                        </span>
                        {a.created_at && <span className="text-zinc-600">{new Date(a.created_at).toLocaleDateString()}</span>}
                      </span>
                    </button>
                    {onDelete ? (
                      <button
                        type="button"
                        aria-label={`Delete ${a.title}`}
                        title="Delete"
                        onClick={() => onDelete(a.id)}
                        className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-red-500/15 hover:text-red-300"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" />
                        </svg>
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
