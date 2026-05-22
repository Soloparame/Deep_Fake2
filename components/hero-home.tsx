"use client";

import { useRouter } from "next/navigation";
import VideoThumb from "@/public/images/hero-image-01.jpg";
import ModalVideo from "@/components/modal-video";
import Link from "next/link";

export default function HeroHome() {
  const router = useRouter();

  const handleDetectClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      const token = window.localStorage.getItem("realeye_token");
      if (token) {
        router.push("/tools");
      } else {
        router.push("/signin");
      }
    }
  };

  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Hero content */}
        <div className="py-12 md:py-20">
          <div className="grid items-start gap-12 pb-12 md:grid-cols-2 md:pb-20">
            <div>
              <h1 className="pb-6 font-nacelle text-5xl font-semibold text-slate-900 md:text-7xl" data-aos="fade-up">
                Originality you can <span className="text-indigo-600">trust.</span>
              </h1>
              <p className="mb-10 text-lg leading-relaxed text-slate-600 md:text-2xl" data-aos="fade-up" data-aos-delay={200}>
                Multi-modal AI Integrity Suite combines fake video &amp; image tools plus Project Intel in one clean workspace.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  className="btn group cursor-pointer rounded-lg bg-indigo-500 px-6 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-indigo-600"
                  href="#0"
                  onClick={handleDetectClick}
                >
                  Start checking  (free)
                </a>
                <Link className="btn rounded-lg border border-slate-200 bg-white px-6 py-2.5 font-medium text-slate-700 transition-all hover:bg-slate-50" href="/pages/how-it-works">
                  See all tools
                </Link>
              </div>
            </div>
            <div className="rounded-3xl border border-indigo-100 bg-white p-4 shadow-xl">
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                <p className="text-sm text-slate-500">Scan results</p>
                <p className="mt-2 text-5xl font-semibold text-indigo-600">97% <span className="text-xl text-slate-700">original</span></p>
                <div className="mt-4 h-2 rounded-full bg-indigo-100">
                  <div className="h-full w-[97%] rounded-full bg-indigo-500" />
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2"><span>Web sources scanned</span><span className="font-semibold">62.4B</span></div>
                  <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2"><span>Academic papers</span><span className="font-semibold">Yes</span></div>
                  <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2"><span>AI text probability</span><span className="font-semibold">3%</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Video container with better framing */}
          <div className="mx-auto max-w-4xl" data-aos="fade-up" data-aos-delay={400}>
            <ModalVideo
              thumb={VideoThumb}
              thumbWidth={880}
              thumbHeight={495}
              thumbAlt="Modal video thumbnail"
              video="/videos/video.mp4"
              videoWidth={1920}
              videoHeight={1080}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
