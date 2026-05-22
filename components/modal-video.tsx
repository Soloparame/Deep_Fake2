"use client";

import { useState, useRef } from "react";
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
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="relative">
      {/* Secondary illustration */}
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

      {/* Video container */}
      <div className="relative overflow-hidden rounded-3xl shadow-2xl shadow-indigo-500/10">
        {/* Border wrapper */}
        <div className="absolute inset-0 rounded-3xl bg-linear-to-br from-indigo-500/20 via-purple-500/10 to-indigo-500/20 p-[1px]">
          <div className="h-full w-full rounded-3xl bg-gray-950" />
        </div>

        {/* Video player */}
        <video
          ref={videoRef}
          width={videoWidth}
          height={videoHeight}
          loop
          controls
          className="relative aspect-video w-full rounded-3xl"
          poster={thumb.src}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        >
          <source src={video} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Custom play button overlay (only shown when not playing) */}
        {!isPlaying && (
          <button
            className="group absolute inset-0 z-10 flex items-center justify-center rounded-3xl focus:outline-hidden focus-visible:ring-3 focus-visible:ring-indigo-200"
            onClick={handlePlay}
            aria-label="Play video"
          >
            {/* Play icon */}
            <div className="rounded-full border border-indigo-300 bg-white backdrop-blur-sm p-4 shadow-xl shadow-indigo-500/20 transition-transform group-hover:scale-110 group-hover:border-indigo-500/50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={24}
                height={24}
                fill="none"
              >
                <path
                  fill="url(#pla)"
                  fillRule="evenodd"
                  d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12Zm4-12-6-4v8l6-4Z"
                  clipRule="evenodd"
                />
                <defs>
                  <linearGradient
                    id="pla"
                    x1={12}
                    x2={12}
                    y1={0}
                    y2={24}
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#6366F1" />
                    <stop offset={1} stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="absolute left-1/2 top-full mt-4 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-4 py-2 text-sm font-medium leading-tight text-slate-900 backdrop-blur-sm shadow-lg shadow-indigo-500/20">
              Watch Demo
              <span className="text-indigo-400"> - </span>
              3:47
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
