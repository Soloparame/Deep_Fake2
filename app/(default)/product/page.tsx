import Link from "next/link";

export const metadata = {
  title: "Product - Multi-modal AI Integrity Suite",
  description:
    "Explore the complete RealEye product: deepfake video detection, AI image verification, project intelligence, workflow details, and secure reporting.",
};

const capabilityCards = [
  {
    title: "Deepfake Video Detection",
    description:
      "Frame-level analysis detects synthetic faces, lip-sync issues, and manipulation artifacts with confidence scoring.",
  },
  {
    title: "AI Image Verification",
    description:
      "Identify AI-generated or heavily edited visuals before publishing, sharing, or using as evidence.",
  },
  {
    title: "Project Intel",
    description:
      "Run similarity and competitor-aware analysis with actionable recommendations and strategic insights.",
  },
  {
    title: "Explainable Reports",
    description:
      "Receive clear decisions, confidence levels, and reasoned outputs designed for practical decision-making.",
  },
  {
    title: "Private Processing",
    description:
      "Account-scoped history, secure handling, and privacy-first controls protect sensitive media and documents.",
  },
  {
    title: "Fast Turnaround",
    description:
      "Optimized pipelines return analysis quickly so teams can verify authenticity without workflow delays.",
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "Choose Your Analysis",
    description: "Select video detection, image verification, or Project Intel based on your content type.",
  },
  {
    step: "02",
    title: "Upload or Submit Content",
    description: "Add media files or project details through a clean upload flow designed for speed.",
  },
  {
    step: "03",
    title: "AI Processing Pipeline",
    description: "RealEye runs the relevant models, extracts signals, and calculates confidence and similarity scores.",
  },
  {
    step: "04",
    title: "Review Final Report",
    description: "Get a readable result with supporting context, indicators, and recommendations you can use immediately.",
  },
];

const useCases = [
  "Media and journalism verification",
  "Academic and research originality checks",
  "Brand and social content validation",
  "Startup and product concept analysis",
  "Compliance and investigation support",
  "Agency quality and trust workflows",
];

export default function ProductPage() {
  return (
    <section className="relative min-h-screen overflow-hidden pb-20 pt-28 text-white md:pb-24 md:pt-36">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[10%] top-[10%] h-80 w-80 rounded-full bg-indigo-600/15 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[10%] h-72 w-72 rounded-full bg-violet-600/15 blur-[110px]" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">
            Product Overview
          </p>
          <h1 className="mt-5 font-nacelle text-4xl font-semibold tracking-tight text-white md:text-6xl">
            One Platform for Authenticity and Intelligence
          </h1>
          <p className="mt-6 text-lg leading-8 text-indigo-100/80 md:text-xl">
            RealEye combines deepfake video analysis, AI image verification, and project intelligence in one polished
            workspace. From upload to final report, each step is built to be clear, fast, and trustworthy.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500"
            >
              Start free
            </Link>
            <Link
              href="/pages/how-it-works"
              className="rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              See technical flow
            </Link>
          </div>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-indigo-400/20 bg-white/5 px-4 py-5 text-center backdrop-blur-sm">
            <p className="text-3xl font-semibold text-indigo-600">120K+</p>
            <p className="mt-1 text-sm text-indigo-100/80">Analyses completed</p>
          </div>
          <div className="rounded-2xl border border-indigo-400/20 bg-white/5 px-4 py-5 text-center backdrop-blur-sm">
            <p className="text-3xl font-semibold text-indigo-600">&lt; 40 sec</p>
            <p className="mt-1 text-sm text-indigo-100/80">Average processing time</p>
          </div>
          <div className="rounded-2xl border border-indigo-400/20 bg-white/5 px-4 py-5 text-center backdrop-blur-sm">
            <p className="text-3xl font-semibold text-indigo-600">Up to 99%</p>
            <p className="mt-1 text-sm text-indigo-100/80">Detection confidence</p>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-center font-nacelle text-3xl font-semibold text-white md:text-4xl">What You Get</h2>
          <p className="mx-auto mt-4 max-w-3xl text-center text-indigo-100/80">
            Every module is designed for real decisions, not just model output. You get practical signals, context,
            and next-step clarity.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {capabilityCards.map((card) => (
              <article
                key={card.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-indigo-400/40"
              >
                <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                <p className="mt-2 text-sm leading-7 text-indigo-100/80">{card.description}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-16 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm md:p-8">
          <h2 className="text-center font-nacelle text-3xl font-semibold text-white">How Routing and Flow Work</h2>
          <p className="mx-auto mt-4 max-w-3xl text-center text-indigo-100/80">
            When a visitor clicks <span className="font-semibold text-white">Product</span> in the navbar, they are
            routed to <span className="font-semibold text-white">/product</span>, where the complete product story is
            shown from capabilities to workflow and trust details.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {workflowSteps.map((item) => (
              <article key={item.step} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">Step {item.step}</p>
                <h3 className="mt-2 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-indigo-100/80">{item.description}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h2 className="font-nacelle text-2xl font-semibold text-white">Where Teams Use It</h2>
            <ul className="mt-4 grid gap-2">
              {useCases.map((useCase) => (
                <li key={useCase} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-indigo-100">
                  {useCase}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h2 className="font-nacelle text-2xl font-semibold text-white">Trust, Privacy, and Clarity</h2>
            <p className="mt-4 text-sm leading-7 text-indigo-100/80">
              RealEye is built with privacy-first handling, account-scoped history, and clear outputs that explain the
              result quality. That means users can move from uncertainty to action with evidence they can understand.
            </p>
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-indigo-100">
              Best for creators, agencies, researchers, and teams that need confidence before publishing, approving,
              or investing in content and projects.
            </div>
          </div>
        </div>

        <div className="mt-16 rounded-3xl border border-indigo-200 bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-center text-white shadow-xl shadow-indigo-500/20">
          <h2 className="font-nacelle text-3xl font-semibold">Ready to Explore the Full Product?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-indigo-100">
            Create an account to run your first check, compare results, and access the full RealEye toolset in one
            dashboard.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
            >
              Create account
            </Link>
            <Link
              href="/signin"
              className="rounded-full border border-indigo-100 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
