"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CVForm from "@/components/cv-generator/cv-form";
import CVPreview from "@/components/cv-generator/cv-preview";
import { defaultCVData, type CVData } from "@/types/cv";

export default function CVGeneratorPage() {
  const [data, setData] = useState<CVData>({
    ...defaultCVData,
    fullName: "",
    roles: [],
    contact: { location: "", phone: "", email: "" },
    skills: [],
    aboutMe: "",
    education: [],
    experience: [],
    skillsList: [],
    socialLinks: {},
    topClients: [],
    testimonials: [],
  });
  const [step, setStep] = useState(1);
  const [downloading, setDownloading] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const cvRef = useRef<HTMLDivElement | null>(null);

  // Load \"My CV\" from localStorage on first mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("realeye_my_cv");
      if (!raw) return;
      const parsed = JSON.parse(raw) as { data: CVData; updatedAt?: string };
      if (parsed?.data) {
        setData(parsed.data);
        if (parsed.updatedAt) setLastSavedAt(parsed.updatedAt);
      }
    } catch (e) {
      console.error("Failed to load saved CV", e);
    }
  }, []);

  const filename = useMemo(() => {
    const safe = (data.fullName || "cv").trim().replace(/[^\w\- ]+/g, "").replace(/\s+/g, "_");
    return `${safe || "cv"}.pdf`;
  }, [data.fullName]);

  const handleSaveMyCV = () => {
    if (typeof window === "undefined") return;
    try {
      const updatedAt = new Date().toISOString();
      window.localStorage.setItem(
        "realeye_my_cv",
        JSON.stringify({
          data,
          updatedAt,
        }),
      );
      setLastSavedAt(updatedAt);
    } catch (e) {
      console.error("Failed to save CV", e);
    }
  };

  const handleDownload = async () => {
    if (downloading) return;
    const el = cvRef.current;
    if (!el) return;

    setDownloading(true);
    try {
      // Dynamic import to avoid SSR/bundling issues
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fonts = (document as any).fonts;
      if (fonts?.ready) await fonts.ready;
      await new Promise((r) => setTimeout(r, 100));

      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: false,
        allowTaint: false,
        logging: false,
        imageTimeout: 0,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = position - pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
        heightLeft -= pageHeight;
      }

      pdf.save(filename);
    } catch (e) {
      console.error("PDF generation failed", e);
      const msg = e instanceof Error ? e.message : String(e);
      alert(`Failed to download PDF: ${msg}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="relative min-h-[calc(100vh-80px)] py-12">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-[20%] top-[20%] h-80 w-80 rounded-full bg-indigo-600/10 blur-[100px]" />
        <div className="absolute right-[20%] bottom-[20%] h-56 w-56 rounded-full bg-violet-600/10 blur-[80px]" />
      </div>

      <div className="container mx-auto max-w-2xl px-4 sm:px-6">
        <div className="mb-6 text-center">
          <h1 className="mb-2 font-nacelle text-3xl font-bold tracking-tight text-white md:text-4xl">
            <span className="bg-gradient-to-r from-indigo-200 via-white to-indigo-200 bg-clip-text text-transparent">
              CV Generator
            </span>
          </h1>
          <p className="text-sm text-indigo-200/60">
            Fill in your details step by step. When ready, download your CV as a PDF.
          </p>
        </div>

        <div className="mb-4 rounded-2xl border border-white/10 bg-gray-900/60 px-4 py-3 text-xs text-indigo-100/80">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-indigo-200">My CV</span>
            {lastSavedAt && (
              <span className="text-[10px] text-indigo-200/70">
                Last saved {new Date(lastSavedAt).toLocaleString()}
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-indigo-200/70">
            The form below edits your personal CV. Use &quot;Save to My CV&quot; on the last step to store changes on
            this device.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gray-950/80 p-5 shadow-xl backdrop-blur-sm sm:p-6">
          <CVForm
            data={data}
            onChange={setData}
            step={step}
            setStep={setStep}
            onDownload={handleDownload}
            onSave={handleSaveMyCV}
            downloading={downloading}
            lastSavedAt={lastSavedAt}
          />
        </div>
      </div>

      {/* Hidden CV used for PDF export (kept in DOM for html2canvas) */}
      <div
        className="fixed left-0 top-0 -z-50 pointer-events-none bg-white"
        style={{ width: 794, opacity: 0.01 }}
        aria-hidden="true"
      >
        <div ref={cvRef} className="bg-white">
          <CVPreview data={data} />
        </div>
      </div>
    </section>
  );
}
