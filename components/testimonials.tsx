"use client";

import { useState } from "react";
import Link from "next/link";

const faqs = [
  {
    category: "general",
    question: "What is RealEye and how does it work?",
    answer: "RealEye is an AI trust platform with three core tools: deepfake video detection, AI image detection (Image Doctor), and Project Intel analysis for similarity, competitor discovery, and strategic insights.",
  },
  {
    category: "general",
    question: "What file formats does RealEye support?",
    answer: "For media checks, RealEye supports common video formats such as MP4, MOV, AVI, and WebM, plus major image formats for Image Doctor. Project Intel supports pasted text and document uploads (PDF/DOCX).",
  },
  {
    category: "general",
    question: "How accurate are the analysis results?",
    answer: "RealEye combines model confidence with context-aware processing. Media checks provide confidence signals, while Project Intel blends semantic similarity and market search context to produce practical, stable scoring.",
  },
  {
    category: "privacy",
    question: "Is my uploaded data secure?",
    answer: "Yes. Uploaded media and documents are processed through secured backend services with account-scoped history access. Data handling follows privacy-first design so analyses stay tied to your account context.",
  },
  {
    category: "privacy",
    question: "Where is processing performed?",
    answer: "Processing is performed server-side through secured API services. Depending on the feature, RealEye may call model providers for inference (for example Hugging Face) while preserving your app-level auth and workflow controls.",
  },
  {
    category: "technical",
    question: "How long does analysis take?",
    answer: "Runtime depends on task type: image checks are usually fastest, video analysis depends on length and sampled frames, and Project Intel depends on document size plus web/context enrichment.",
  },
  {
    category: "technical",
    question: "What makes RealEye different from other detection tools?",
    answer: "Most tools stop at detection. RealEye combines media authenticity checks with Project Intel, so you can validate content and also understand market overlap, competitors, and strategic direction in one place.",
  },
  {
    category: "technical",
    question: "Can RealEye detect every manipulation type?",
    answer: "No tool can guarantee 100% coverage of every evolving manipulation technique. RealEye is designed to improve reliability with multiple detection paths and continuous model and pipeline updates.",
  },
  {
    category: "technical",
    question: "What is Project Intel?",
    answer: "Project Intel is RealEye's strategy analysis workspace (formerly labeled plagiarism). It includes smart similarity scoring, competitor discovery, SWOT, tech lens, recommendations, and devil's advocate prompts.",
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
          <h2 className="pb-4 font-nacelle text-3xl font-semibold text-slate-900 md:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-indigo-100/90">
            Everything you need to know about RealEye's detection and Project Intel capabilities,
            privacy posture, and technical behavior.
          </p>
        </div>

        {/* Category buttons */}
        <div className="flex justify-center pb-8 max-md:hidden md:pb-12">
          <div className="relative inline-flex flex-wrap justify-center rounded-[1.25rem] bg-gray-800/40 p-1">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`flex h-8 items-center gap-2.5 whitespace-nowrap rounded-full px-4 text-sm font-medium text-[#e2e8f0] transition-colors focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-indigo-200 ${activeCategory === category.id
                  ? "bg-gray-800 border border-indigo-500/60 text-white"
                  : "opacity-85 transition-opacity hover:opacity-100"
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
              className="group overflow-hidden rounded-2xl border border-gray-700/70 bg-gray-900/60 backdrop-blur-xs transition-all hover:border-indigo-400/50 hover:bg-gray-800/50"
            >
              <button
                className="flex w-full items-start justify-between gap-4 p-5 text-left text-[#e5e7eb]"
                onClick={() => toggleQuestion(index)}
              >
                <span className="text-lg font-medium text-[#f8fafc] transition-colors group-hover:text-white">
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
                  <p className="text-[#cbd5e1]">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center">
          <p className="mb-4 text-indigo-100/90">
            Still have questions?
          </p>
          <Link
            href="/contact"
            className="btn-sm bg-linear-to-t from-indigo-600 to-indigo-500 bg-[length:100%_100%] bg-[bottom] py-[5px] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%]"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
