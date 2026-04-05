"use client";

type Props = { questions: string[] };

export function DevilsAdvocateCard({ questions }: Props) {
  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-red-500/35 bg-gradient-to-br from-red-950/50 via-zinc-950/80 to-zinc-950 shadow-[0_0_60px_-15px_rgba(239,68,68,0.4)] ring-1 ring-red-500/20">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
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
      <div className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full bg-red-600/20 blur-3xl" />

      <div className="relative p-6 sm:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-500/30 bg-red-950/60 shadow-inner">
              <svg className="h-6 w-6 text-red-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1v3h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2v-3h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zM7.5 13a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm9 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
              </svg>
            </div>
            <div>
              <div className="mb-1 inline-flex items-center gap-2 rounded-lg border border-red-500/25 bg-red-500/10 px-2.5 py-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-300">Challenge</span>
              </div>
              <h3 className="text-xl font-semibold text-white">Devil&apos;s advocate</h3>
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
              className="flex gap-4 rounded-2xl border border-red-500/15 bg-black/25 px-4 py-3.5 backdrop-blur-sm transition-colors hover:border-red-500/30"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-500/35 bg-red-950/50 font-mono text-sm font-bold text-red-300">
                {i + 1}
              </span>
              <span className="pt-1 text-sm leading-relaxed text-zinc-200">{q}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
