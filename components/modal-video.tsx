"use client";

import { useState, useRef } from "react";
import type { StaticImageData } from "next/image";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
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
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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

      {/* Video thumbnail with enhanced styling */}
      <button
        className="group relative flex items-center justify-center rounded-3xl focus:outline-hidden focus-visible:ring-3 focus-visible:ring-indigo-200"
        onClick={() => {
          setModalOpen(true);
        }}
        aria-label="Watch the video"
        data-aos="fade-up"
        data-aos-delay={200}
      >
        {/* Border wrapper */}
        <div className="absolute inset-0 rounded-3xl bg-linear-to-br from-indigo-500/20 via-purple-500/10 to-indigo-500/20 p-[1px]">
          <div className="h-full w-full rounded-3xl bg-gray-950">
            {/* Inner glow effect */}
            <div className="absolute inset-0 rounded-3xl bg-linear-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </div>

        {/* Video thumbnail image */}
        <figure className="relative overflow-hidden rounded-3xl shadow-2xl shadow-indigo-500/10 transition-shadow group-hover:shadow-indigo-500/20">
          <Image
            className="opacity-60 transition-all duration-500 group-hover:scale-105 group-hover:opacity-80"
            src={thumb}
            width={thumbWidth}
            height={thumbHeight}
            priority
            alt={thumbAlt}
          />
        </figure>

        {/* Play icon with enhanced styling */}
        <span className="pointer-events-none absolute">
          <div className="rounded-full border border-gray-700/50 bg-gray-900/80 backdrop-blur-sm p-4 shadow-xl shadow-black/50 transition-transform group-hover:scale-110 group-hover:border-indigo-500/50">
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
          <span className="absolute left-1/2 top-full mt-4 -translate-x-1/2 whitespace-nowrap rounded-full bg-gray-900/80 px-4 py-2 text-sm font-medium leading-tight text-gray-200 backdrop-blur-sm shadow-lg shadow-black/50">
            Watch Demo
            <span className="text-gray-500"> - </span>
            3:47
          </span>
        </span>
      </button>
      {/* End: Video thumbnail */}

      <Dialog
        initialFocus={videoRef}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 z-99999 bg-black/70 transition-opacity duration-300 ease-out data-closed:opacity-0"
        />
        <div className="fixed inset-0 z-99999 flex px-4 py-6 sm:px-6">
          <div className="mx-auto flex h-full max-w-6xl items-center">
            <DialogPanel
              transition
              className="aspect-video max-h-full w-full overflow-hidden rounded-2xl bg-black shadow-2xl duration-300 ease-out data-closed:scale-95 data-closed:opacity-0"
            >
              <video
                ref={videoRef}
                width={videoWidth}
                height={videoHeight}
                loop
                controls
              >
                <source src={video} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
