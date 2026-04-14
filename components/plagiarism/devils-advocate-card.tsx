"use client";

type Props = { questions: string[] };

export function DevilsAdvocateCard({ questions }: Props) {
  return (
    <div className="group/devil relative overflow-hidden rounded-3xl border-2 border-red-500/30 bg-gradient-to-br from-red-950/50 via-zinc-950/80 to-zinc-950 shadow-[0_0_50px_-15px_rgba(239,68,68,0.3)] ring-1 ring-red-500/10 transition-all duration-500 hover:border-red-500/50 hover:shadow-[0_0_80px_-15px_rgba(239,68,68,0.5)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05] transition-opacity duration-500 group-hover/devil:opacity-[0.1]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 6px,
            rgba(248, 113, 113, 0.5) 6px,
            rgba(248, 113, 113, 0.5) 7px
          )`,
        }}
      />
      <div className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full bg-red-600/20 blur-3xl transition-all duration-700 group-hover/devil:bg-red-500/30 group-hover/devil:blur-[50px] group-hover/devil:scale-125" />

      <div className="relative p-6 sm:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-500/30 bg-red-950/60 shadow-inner transition-transform duration-500 group-hover/devil:scale-110 group-hover/devil:-rotate-6 group-hover/devil:shadow-[0_0_20px_rgba(239,68,68,0.3)]">
              <svg className="h-6 w-6 text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.5)] transition-colors group-hover/devil:text-red-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1v3h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2v-3h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zM7.5 13a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm9 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
              </svg>
            </div>
            <div>
              <div className="mb-1 inline-flex items-center gap-2 rounded-lg border border-red-500/25 bg-red-500/10 px-2.5 py-1 transition-colors group-hover/devil:border-red-500/40">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-300">Challenge</span>
              </div>
              <h3 className="text-xl font-semibold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">Devil&apos;s advocate</h3>
              <p className="mt-1 max-w-lg text-sm leading-relaxed text-red-200/65">
                Stress-test your narrative before review — these are the questions reviewers love to ask.
              </p>
            </div>
          </div>
        </div>

        <ol className="space-y-4">
          {questions.map((q, i) => (
            <li
              key={i}
              className="group/item flex items-center gap-4 rounded-2xl border border-red-500/15 bg-black/40 px-5 py-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.01] hover:border-red-500/50 hover:bg-red-950/20 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-500/35 bg-red-950/50 font-mono text-sm font-bold text-red-300 transition-all duration-300 group-hover/item:border-red-500 group-hover/item:bg-red-500/20 group-hover/item:text-white group-hover/item:shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                {i + 1}
              </span>
              <span className="text-sm font-medium leading-relaxed text-zinc-300 transition-colors duration-300 group-hover/item:text-white">{q}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
