"use client";

import { useEffect, useState } from "react";
import CVPreview from "@/components/cv-generator/cv-preview";
import type { CVData } from "@/types/cv";
import { defaultCVData } from "@/types/cv";

export default function CVDownloadPage() {
  const [data, setData] = useState<CVData | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("cv_download_data");
      if (raw) {
        const parsed = JSON.parse(raw) as CVData;
        setData(parsed);
      } else {
        setData(defaultCVData);
      }
    } catch {
      setData(defaultCVData);
    }
  }, []);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-8 print:bg-white">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
      <div className="mx-auto max-w-4xl px-4">
        <div className="no-print mb-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-indigo-600"
          >
            Print / Save as PDF
          </button>
          <button
            type="button"
            onClick={() => window.close()}
            className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10"
          >
            Close
          </button>
        </div>
        <div className="overflow-hidden rounded-lg bg-white shadow-2xl print:shadow-none">
          <CVPreview data={data} />
        </div>
      </div>
    </div>
  );
}
