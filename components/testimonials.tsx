"use client";

import { useState } from "react";

const faqs = [
  {
    category: "general",
    question: "What is RealEye and how does it work?",
    answer: "RealEye is an AI-powered deepfake detection system that uses advanced deep learning models (XceptionNet and EfficientNet) to analyze videos and detect AI-generated or manipulated content. It processes videos through frame extraction, face detection using MTCNN/Dlib, and feature analysis to determine authenticity.",
  },
  {
    category: "general",
    question: "What file formats does RealEye support?",
    answer: "RealEye supports all major video formats including MP4, MOV, AVI, MKV, and WebM. The system uses OpenCV and FFmpeg for frame extraction and processing.",
  },
  {
    category: "general",
    question: "How accurate is RealEye's detection?",
    answer: "RealEye uses state-of-the-art deep learning models trained on extensive datasets to achieve high accuracy in detecting deepfakes. The system provides confidence scores for each analysis to help you understand the reliability of the results.",
  },
  {
    category: "privacy",
    question: "Is my video data secure?",
    answer: "Yes, privacy is our top priority. All uploaded videos are processed securely and deleted immediately after analysis. We never store your videos permanently, ensuring your data remains private and protected.",
  },
  {
    category: "privacy",
    question: "Where is my video processed?",
    answer: "Your video is processed on our secure servers using encrypted connections. Once analysis is complete, the video file is permanently deleted from our systems within minutes of processing.",
  },
  {
    category: "technical",
    question: "How long does video analysis take?",
    answer: "Analysis time depends on video length and resolution. Typical processing times range from a few seconds for short clips to a minute or two for longer videos. The system is optimized for fast and efficient processing.",
  },
  {
    category: "technical",
    question: "What makes RealEye different from other detection tools?",
    answer: "RealEye combines multiple advanced AI models (XceptionNet and EfficientNet) with facial feature analysis to provide comprehensive deepfake detection. Our system can identify subtle inconsistencies that indicate AI manipulation, providing detailed confidence scores and analysis reports.",
  },
  {
    category: "technical",
    question: "Can RealEye detect all types of deepfakes?",
    answer: "RealEye is designed to detect various types of AI-generated and manipulated content, including face swaps, reenactments, and synthetic videos. However, as deepfake technology evolves, continuous model updates are necessary to maintain detection accuracy against new techniques.",
  },
  {
    category: "technical",
    question: "Does RealEye work with audio as well?",
    answer: "Currently, RealEye focuses on visual deepfake detection. Audio verification is under development and will be available in future updates. For now, the system analyzes video frames and facial features to detect manipulation.",
  },
];

export default function Testimonials() {
  const [activeCategory, setActiveCategory] = useState<string>("general");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const categories = [
    { id: "general", label: "General" },
    { id: "privacy", label: "Privacy & Security" },
    { id: "technical", label: "Technical" },
  ];

  const filteredFaqs = faqs.filter((faq) => faq.category === activeCategory);

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="border-t py-12 [border-image:linear-gradient(to_right,transparent,--theme(--color-slate-400/.25),transparent)1] md:py-20">
        {/* Section header */}
        <div className="mx-auto max-w-3xl pb-12 text-center">
          <h2 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-4 font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-indigo-200/65">
            Everything you need to know about RealEye's deepfake detection capabilities, 
            privacy features, and technical specifications.
          </p>
        </div>

        {/* Category buttons */}
        <div className="flex justify-center pb-8 max-md:hidden md:pb-12">
          <div className="relative inline-flex flex-wrap justify-center rounded-[1.25rem] bg-gray-800/40 p-1">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`flex h-8 items-center gap-2.5 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-indigo-200 ${
                  activeCategory === category.id
                    ? "relative bg-linear-to-b from-gray-900 via-gray-800/60 to-gray-900 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_bottom,--theme(--color-indigo-500/0),--theme(--color-indigo-500/.5))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)]"
                    : "opacity-65 transition-opacity hover:opacity-90"
                }`}
                onClick={() => {
                  setActiveCategory(category.id);
                  setOpenIndex(0);
                }}
              >
                <span>{category.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* FAQ List */}
        <div className="mx-auto max-w-3xl space-y-3">
          {filteredFaqs.map((faq, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl bg-linear-to-br from-gray-900/50 via-gray-800/25 to-gray-900/50 backdrop-blur-xs transition-all before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-gray-800),var(--color-gray-700),var(--color-gray-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] hover:bg-gray-800/40"
            >
              <button
                className="flex w-full items-start justify-between gap-4 p-5 text-left"
                onClick={() => toggleQuestion(index)}
              >
                <span className="text-lg font-medium text-gray-200 transition-colors group-hover:text-indigo-200">
                  {faq.question}
                </span>
                <svg
                  className={`mt-0.5 h-5 w-5 shrink-0 text-gray-400 transition-transform ${openIndex === index ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === index && (
                <div className="px-5 pb-5">
                  <p className="text-indigo-200/65">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center">
          <p className="mb-4 text-indigo-200/65">
            Still have questions?
          </p>
          <a
            href="#0"
            className="btn-sm bg-linear-to-t from-indigo-600 to-indigo-500 bg-[length:100%_100%] bg-[bottom] py-[5px] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%]"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
