"use client";

import { useState, useEffect } from "react";
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
        router.push("/upload");
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
          {/* Section header */}
          <div className="pb-12 text-center md:pb-20">
            <h1
              className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-5 font-nacelle text-4xl font-semibold text-transparent md:text-5xl"
              data-aos="fade-up"
            >
              One Platform for Trust in Media and Ideas
            </h1>
            <div className="mx-auto max-w-3xl">
              <p
                className="mb-8 text-xl text-indigo-200/65"
                data-aos="fade-up"
                data-aos-delay={200}
              >
                RealEye combines deepfake video detection, AI image checks, and Project Intel analysis.
                Verify media authenticity and benchmark your project against real competitors in one workflow.
              </p>
              <div className="mx-auto max-w-xs sm:flex sm:max-w-none sm:justify-center">
                <div data-aos="fade-up" data-aos-delay={400}>
                  <a
                    className="btn group mb-4 w-full cursor-pointer bg-linear-to-t from-indigo-600 to-indigo-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%] sm:mb-0 sm:w-auto"
                    href="#0"
                    onClick={handleDetectClick}
                  >
                    <span className="relative inline-flex items-center">
                      Start Analysis
                      <span className="ml-1 tracking-normal text-white/50 transition-transform group-hover:translate-x-0.5">
                        -&gt;
                      </span>
                    </span>
                  </a>
                </div>
                <div data-aos="fade-up" data-aos-delay={600}>
                  <Link
                    className="btn w-full border border-gray-700/70 bg-gray-900/60 text-[#f8fafc] transition-all hover:border-indigo-400/50 hover:bg-gray-800/50 sm:ml-4 sm:w-auto"
                    href="/pages/how-it-works"
                  >
                    Explore How It Works
                  </Link>
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
              video="videos//video.mp4"
              videoWidth={1920}
              videoHeight={1080}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
