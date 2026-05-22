"use client";

import { useEffect, useRef } from "react";
import type { StaticImageData } from "next/image";
import Image from "next/image";
import SecondaryIllustration from "@/public/images/secondary-illustration.svg";

interface ModalVideoProps {
  thumb: StaticImageData;
  thumbWidth: number;
  thumbHeight: number;
  thumbAlt: string;
  video: string;
  videoWidth: number;
  videoHeight: number;
}

export default function ModalVideo({
  thumb,
  thumbWidth,
  thumbHeight,
  thumbAlt,
  video,
  videoWidth,
  videoHeight,
}: ModalVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const userPausedRef = useRef(false);

  const playWhenVisible = async (videoEl: HTMLVideoElement) => {
    try {
      await videoEl.play();
    } catch {
      videoEl.muted = true;
      await videoEl.play().catch(() => {});
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const videoEl = videoRef.current;
        if (!videoEl) return;

        if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
          if (!userPausedRef.current) {
            void playWhenVisible(videoEl);
          }
        } else {
          videoEl.pause();
          if (!entry.isIntersecting) {
            userPausedRef.current = false;
          }
        }
      },
      { threshold: [0, 0.35, 0.5, 0.75] },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div
        className="pointer-events-none absolute bottom-8 left-1/2 -z-10 -ml-28 -translate-x-1/2 translate-y-1/2"
        aria-hidden="true"
      >
        <Image
          className="md:max-w-none"
          src={SecondaryIllustration}
          width={1165}
          height={1012}
          alt="Secondary illustration"
        />
      </div>

      <div
        className="group relative overflow-hidden rounded-3xl focus-within:ring-3 focus-within:ring-indigo-200"
        data-aos="fade-up"
        data-aos-delay={200}
      >
        <div className="absolute inset-0 rounded-3xl bg-linear-to-br from-indigo-500/20 via-purple-500/10 to-indigo-500/20 p-[1px]">
          <div className="h-full w-full rounded-3xl bg-gray-950" />
        </div>

        <figure className="relative overflow-hidden rounded-3xl shadow-2xl shadow-indigo-500/10">
          <video
            ref={videoRef}
            width={videoWidth}
            height={videoHeight}
            poster={thumb.src}
            loop
            playsInline
            controls
            className="aspect-video w-full bg-black"
            aria-label={thumbAlt}
            onPause={() => {
              userPausedRef.current = true;
            }}
            onPlay={() => {
              userPausedRef.current = false;
            }}
          >
            <source src={video} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </figure>

      </div>
    </div>
  );
}
