import Image from "next/image";
import WorflowImg01 from "@/public/images/workflow-01.png";
import WorflowImg02 from "@/public/images/workflow-02.png";
import WorflowImg03 from "@/public/images/workflow-03.png";
import Spotlight from "@/components/spotlight";

export default function Workflows() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="pb-12 md:pb-20">
          {/* Section header */}
          <div className="mx-auto max-w-3xl pb-12 text-center md:pb-20">
            <div className="inline-flex items-center gap-3 pb-3 before:h-px before:w-8 before:bg-linear-to-r before:from-transparent before:to-indigo-200/50 after:h-px after:w-8 after:bg-linear-to-l after:from-transparent after:to-indigo-200/50">
              <span className="inline-flex text-indigo-600">
                Simple Process
              </span>
            </div>
            <h2 className="pb-4 font-nacelle text-3xl font-semibold text-slate-900 md:text-4xl">
              How Multi-modal AI Integrity Suite Works
            </h2>
            <p className="text-lg text-slate-600">
              A simple 3-step flow for deepfake video checks, image authenticity,
              and Project Intel analysis.
            </p>
          </div>
          {/* Spotlight items */}
          <Spotlight className="group mx-auto grid max-w-sm items-start gap-6 lg:max-w-none lg:grid-cols-3">
            {/* Card 1 */}
            <a
              className="group/card relative h-full overflow-hidden rounded-2xl border border-indigo-100 bg-white p-px shadow-sm before:pointer-events-none before:absolute before:-left-40 before:-top-40 before:z-10 before:h-80 before:w-80 before:translate-x-[var(--mouse-x)] before:translate-y-[var(--mouse-y)] before:rounded-full before:bg-indigo-500/25 before:opacity-0 before:blur-3xl before:transition-opacity before:duration-500 after:pointer-events-none after:absolute after:-left-48 after:-top-48 after:z-30 after:h-64 after:w-64 after:translate-x-[var(--mouse-x)] after:translate-y-[var(--mouse-y)] after:rounded-full after:bg-indigo-300 after:opacity-0 after:blur-3xl after:transition-opacity after:duration-500 hover:after:opacity-20 group-hover:before:opacity-100"
              href="#0"
            >
              <div className="relative z-20 h-full overflow-hidden rounded-[inherit] bg-white after:pointer-events-none after:absolute after:inset-0 after:z-0 after:bg-linear-to-br after:from-indigo-50/70 after:via-white after:to-indigo-50/30">
                {/* Arrow */}
                <div
                  className="absolute right-6 top-6 z-[3] flex h-8 w-8 items-center justify-center rounded-full border border-indigo-200 bg-white text-indigo-600 opacity-0 transition-opacity group-hover/card:opacity-100"
                  aria-hidden="true"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={9}
                    height={8}
                    fill="none"
                  >
                    <path
                      fill="#F4F4F5"
                      d="m4.92 8-.787-.763 2.733-2.68H0V3.443h6.866L4.133.767 4.92 0 9 4 4.92 8Z"
                    />
                  </svg>
                </div>
                {/* Image — above gradient overlay */}
                <div className="relative z-[2] w-full">
                  <Image className="h-auto w-full" src={WorflowImg01} width={350} height={288} alt="Workflow 01" />
                </div>
                {/* Content */}
                <div className="relative z-10 p-6">
                  <div className="mb-3">
                    <span className="btn-sm relative rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                      <span>
                        Step 1
                      </span>
                    </span>
                  </div>
                  <p className="text-slate-700">
                    Choose your input: upload a video, upload an image, or paste/upload
                    project content for Project Intel.
                  </p>
                </div>
              </div>
            </a>
            {/* Card 2 */}
            <a
              className="group/card relative h-full overflow-hidden rounded-2xl border border-indigo-100 bg-white p-px shadow-sm before:pointer-events-none before:absolute before:-left-40 before:-top-40 before:z-10 before:h-80 before:w-80 before:translate-x-[var(--mouse-x)] before:translate-y-[var(--mouse-y)] before:rounded-full before:bg-indigo-500/25 before:opacity-0 before:blur-3xl before:transition-opacity before:duration-500 after:pointer-events-none after:absolute after:-left-48 after:-top-48 after:z-30 after:h-64 after:w-64 after:translate-x-[var(--mouse-x)] after:translate-y-[var(--mouse-y)] after:rounded-full after:bg-indigo-300 after:opacity-0 after:blur-3xl after:transition-opacity after:duration-500 hover:after:opacity-20 group-hover:before:opacity-100"
              href="#0"
            >
              <div className="relative z-20 h-full overflow-hidden rounded-[inherit] bg-white after:pointer-events-none after:absolute after:inset-0 after:z-0 after:bg-linear-to-br after:from-indigo-50/70 after:via-white after:to-indigo-50/30">
                {/* Arrow */}
                <div
                  className="absolute right-6 top-6 z-[3] flex h-8 w-8 items-center justify-center rounded-full border border-indigo-200 bg-white text-indigo-600 opacity-0 transition-opacity group-hover/card:opacity-100"
                  aria-hidden="true"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={9}
                    height={8}
                    fill="none"
                  >
                    <path
                      fill="#F4F4F5"
                      d="m4.92 8-.787-.763 2.733-2.68H0V3.443h6.866L4.133.767 4.92 0 9 4 4.92 8Z"
                    />
                  </svg>
                </div>
                <div className="relative z-[2] w-full">
                  <Image className="h-auto w-full" src={WorflowImg02} width={350} height={288} alt="Workflow 02" />
                </div>
                {/* Content */}
                <div className="relative z-10 p-6">
                  <div className="mb-3">
                    <span className="btn-sm relative rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                      <span>
                        Step 2
                      </span>
                    </span>
                  </div>
                  <p className="text-slate-700">
                    Multi-modal AI Integrity Suite runs the right pipeline: frame-level deepfake detection,
                    image AI checks, or smart competitor-aware similarity analysis.
                  </p>
                </div>
              </div>
            </a>
            {/* Card 3 */}
            <a
              className="group/card relative h-full overflow-hidden rounded-2xl border border-indigo-100 bg-white p-px shadow-sm before:pointer-events-none before:absolute before:-left-40 before:-top-40 before:z-10 before:h-80 before:w-80 before:translate-x-[var(--mouse-x)] before:translate-y-[var(--mouse-y)] before:rounded-full before:bg-indigo-500/25 before:opacity-0 before:blur-3xl before:transition-opacity before:duration-500 after:pointer-events-none after:absolute after:-left-48 after:-top-48 after:z-30 after:h-64 after:w-64 after:translate-x-[var(--mouse-x)] after:translate-y-[var(--mouse-y)] after:rounded-full after:bg-indigo-300 after:opacity-0 after:blur-3xl after:transition-opacity after:duration-500 hover:after:opacity-20 group-hover:before:opacity-100"
              href="#0"
            >
              <div className="relative z-20 h-full overflow-hidden rounded-[inherit] bg-white after:pointer-events-none after:absolute after:inset-0 after:z-0 after:bg-linear-to-br after:from-indigo-50/70 after:via-white after:to-indigo-50/30">
                {/* Arrow */}
                <div
                  className="absolute right-6 top-6 z-[3] flex h-8 w-8 items-center justify-center rounded-full border border-indigo-200 bg-white text-indigo-600 opacity-0 transition-opacity group-hover/card:opacity-100"
                  aria-hidden="true"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={9}
                    height={8}
                    fill="none"
                  >
                    <path
                      fill="#F4F4F5"
                      d="m4.92 8-.787-.763 2.733-2.68H0V3.443h6.866L4.133.767 4.92 0 9 4 4.92 8Z"
                    />
                  </svg>
                </div>
                <div className="relative z-[2] w-full">
                  <Image className="h-auto w-full" src={WorflowImg03} width={350} height={288} alt="Workflow 03" />
                </div>
                {/* Content */}
                <div className="relative z-10 p-6">
                  <div className="mb-3">
                    <span className="btn-sm relative rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                      <span>
                        Step 3
                      </span>
                    </span>
                  </div>
                  <p className="text-slate-700">
                    Review clear outputs with confidence, competitors found, strategy
                    insights, and export-ready reports.
                  </p>
                </div>
              </div>
            </a>
          </Spotlight>
        </div>
      </div>
    </section>
  );
}
