"use client";

import type { AnalysisListItem } from "@/types/analysis";

type Props = {
  items: AnalysisListItem[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function AnalysisHistorySidebar({ items, loading, selectedId, onSelect }: Props) {
  return (
    <aside className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-zinc-900/90 to-zinc-950/98 p-5 shadow-2xl shadow-black/40 ring-1 ring-white/[0.05]">
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
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">History</h2>
            <p className="text-[11px] text-zinc-600">Saved runs</p>
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
                <button
                  type="button"
                  onClick={() => onSelect(a.id)}
                  className={`group relative w-full overflow-hidden rounded-2xl border px-3.5 py-3 text-left transition-all ${
                    active
                      ? "border-indigo-500/40 bg-gradient-to-r from-indigo-500/15 to-violet-600/10 shadow-lg shadow-indigo-950/30"
                      : "border-white/[0.06] bg-zinc-950/40 hover:border-white/15 hover:bg-zinc-900/60"
                  }`}
                >
                  <span
                    className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-full transition-colors ${
                      active ? "bg-gradient-to-b from-indigo-400 to-violet-500" : "bg-transparent group-hover:bg-zinc-600"
                    }`}
                  />
                  <span className={`line-clamp-2 pl-1 text-sm font-medium ${active ? "text-white" : "text-zinc-300"}`}>
                    {a.title}
                  </span>
                  <span className="mt-2 flex items-center justify-between pl-1 text-[11px] text-zinc-500">
                    <span className="inline-flex items-center gap-1 rounded-md bg-black/25 px-1.5 py-0.5 font-mono text-zinc-400">
                      {Math.round(a.similarity_score)}% match
                    </span>
                    {a.created_at && <span className="text-zinc-600">{new Date(a.created_at).toLocaleDateString()}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
