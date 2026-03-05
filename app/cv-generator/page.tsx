"use client";

export default function CVGeneratorPage() {
  return (
    <section className="relative min-h-[calc(100vh-80px)] py-12">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-[20%] top-[20%] h-80 w-80 rounded-full bg-indigo-600/10 blur-[100px]" />
        <div className="absolute right-[20%] bottom-[20%] h-56 w-56 rounded-full bg-violet-600/10 blur-[80px]" />
      </div>

      <div className="container mx-auto max-w-2xl px-4 sm:px-6">
        <h1 className="mb-2 text-center font-nacelle text-3xl font-bold tracking-tight text-white md:text-4xl">
          <span className="bg-gradient-to-r from-indigo-200 via-white to-indigo-200 bg-clip-text text-transparent">
            CV Generator
          </span>
        </h1>
        <p className="mb-8 text-center text-sm text-indigo-200/60">
          Build a professional resume from your experience and skills
        </p>

        <div className="rounded-2xl border border-white/10 bg-gray-950/80 p-6 shadow-xl backdrop-blur-sm">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/20 ring-1 ring-indigo-500/30">
              <svg className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Create your CV</h2>
              <p className="mt-2 max-w-md text-sm text-indigo-200/70">
                Enter your details, experience, and skills. We&apos;ll generate a clean, ATS-friendly CV you can download or edit.
              </p>
            </div>
            <div className="w-full rounded-xl border-2 border-dashed border-white/10 bg-white/5 px-6 py-12">
              <p className="text-sm text-gray-500">Add your info and we&apos;ll build your CV</p>
              <p className="mt-1 text-xs text-gray-600">Functionality coming soon</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <span className="rounded-full border border-white/5 bg-white/5 px-4 py-2 text-xs text-indigo-200/80">
                Multiple templates
              </span>
              <span className="rounded-full border border-white/5 bg-white/5 px-4 py-2 text-xs text-indigo-200/80">
                PDF export
              </span>
              <span className="rounded-full border border-white/5 bg-white/5 px-4 py-2 text-xs text-indigo-200/80">
                ATS-friendly
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
