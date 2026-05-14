"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { deepfakeDetector, DetectionResult, VideoVerdict } from "@/utils/deepfakeDetector";
import ProjectIntelWorkspace from "@/components/plagiarism/project-intel-workspace";
import VideoDetectorPaymentModal from "@/components/tools/video-detector-payment-modal";
import ImageDetectorPaymentModal from "@/components/tools/image-detector-payment-modal";
import ProPlanModal from "@/components/tools/pro-plan-modal";

interface AnalysisResult {
  label: string;
  confidence: number;
  source?: "huggingface" | "keras";
  videoVerdict?: VideoVerdict;
}

interface HistoryItem {
  id: string;
  filename: string;
  result: string;
  confidence: number;
  created_at: string;
  type?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function authHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("realeye_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getEmailFromToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem("realeye_token");
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const pad = normalized.length % 4 ? "=".repeat(4 - (normalized.length % 4)) : "";
    const decoded = atob(normalized + pad);
    const parsed = JSON.parse(decoded) as { email?: string; sub?: string };
    return parsed.email ?? parsed.sub ?? null;
  } catch {
    return null;
  }
}

const Spinner = () => (
  <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
);

const VideoIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
);

const ImageIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
);

const SettingsIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);

const HelpIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
);

const ResultCard = ({ result, mode }: { result: AnalysisResult; mode: string }) => {
  const v = result.videoVerdict;
  const isFake = (result.label || "").toUpperCase() === "FAKE";
  const statusColor = isFake ? "text-red-600" : "text-emerald-600";
  const barColor = isFake ? "bg-red-500" : "bg-emerald-500";
  const confidencePercent = (result.confidence * 100).toFixed(1);

  if (result.source === "huggingface" && v) {
    const suspicious = v.status === "Suspicious";
    const uncertain = v.status === "Uncertain";
    const statusColorHF = uncertain ? "text-amber-600" : suspicious ? "text-red-600" : "text-emerald-600";
    const barColorHF = uncertain ? "bg-amber-500" : suspicious ? "bg-red-500" : "bg-emerald-500";

    return (
      <div className="mt-6 flex flex-col gap-4">
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <h4 className="text-3xl font-bold text-slate-900">{v.averageFakeProbabilityPercent.toFixed(1)}%</h4>
            <span className={`text-sm font-medium ${statusColorHF}`}>{v.status}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${barColorHF}`}
              style={{ width: `${Math.min(100, v.averageFakeProbabilityPercent)}%` }}
            />
          </div>
        </div>

        <div className="mt-2 space-y-3">
          <div className="flex items-center justify-between border-b border-indigo-100 py-2">
            <span className="text-sm text-slate-600">Models used</span>
            <span className="text-sm font-medium text-slate-900">{v.modelsConfigured} HF models</span>
          </div>
          <div className="flex items-center justify-between border-b border-indigo-100 py-2">
            <span className="text-sm text-slate-600">Samples pooled</span>
            <span className="text-sm font-medium text-slate-900">{v.samplesUsed} frames</span>
          </div>
          <div className="flex items-center justify-between border-b border-indigo-100 py-2">
            <span className="text-sm text-slate-600">Analysis mode</span>
            <span className="max-w-[150px] truncate text-right text-sm font-medium text-slate-900">{mode}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <h4 className="text-3xl font-bold text-slate-900">{confidencePercent}%</h4>
          <span className={`text-sm font-medium ${statusColor}`}>{result.label || "—"}</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
            style={{ width: `${confidencePercent}%` }}
          />
        </div>
      </div>

      <div className="mt-2 space-y-3">
        <div className="flex items-center justify-between border-b border-indigo-100 py-2">
          <span className="text-sm text-slate-600">Analysis mode</span>
          <span className="text-sm font-medium text-slate-900">{mode}</span>
        </div>
      </div>
    </div>
  );
};

export default function ToolsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"video" | "image" | "intel">("intel");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [progress, setProgress] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageResult, setImageResult] = useState<AnalysisResult | null>(null);
  const [imageProgress, setImageProgress] = useState<string>("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [videoPaymentOpen, setVideoPaymentOpen] = useState(false);
  const [imagePaymentOpen, setImagePaymentOpen] = useState(false);
  const [proPlanOpen, setProPlanOpen] = useState(false);

  const openFakeVideoDetector = () => {
    setVideoPaymentOpen(true);
  };

  const openFakeImageDetector = () => {
    setImagePaymentOpen(true);
  };

  useEffect(() => {
    const fetchHistory = async () => {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("realeye_token") : null;
      if (!token) {
        setHistory([]);
        setHistoryError(null);
        return;
      }
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        let userEmail = getEmailFromToken();
        if (!userEmail) {
          const profileRes = await fetch(`${API_BASE}/api/auth/me`, {
            headers: authHeaders(),
          });
          if (profileRes.ok) {
            const profile = (await profileRes.json()) as { email?: string };
            userEmail = profile.email ?? null;
          }
        }
        if (!userEmail) throw new Error("Could not identify signed-in user for history.");
        const historyRes = await fetch(
          `${API_BASE}/api/predictions?user_email=${encodeURIComponent(userEmail)}&limit=15`,
          { headers: authHeaders() }
        );
        if (!historyRes.ok) {
          const txt = await historyRes.text();
          throw new Error(txt || "Failed to load media history.");
        }
        const data = await historyRes.json();
        setHistory(data.predictions || []);
      } catch (err) {
        setHistory([]);
        setHistoryError(err instanceof Error ? err.message : "Failed to load media history.");
      } finally {
        setHistoryLoading(false);
      }
    };
    const onAuth = () => void fetchHistory();
    fetchHistory();
    window.addEventListener("auth-change", onAuth);
    return () => window.removeEventListener("auth-change", onAuth);
  }, [result, imageResult, tab]);

  const handleVideoSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setProgress("");
    if (!file) {
      setError("Please select a video file.");
      return;
    }
    const token = window.localStorage.getItem("realeye_token");
    if (!token) {
      router.push("/signin");
      return;
    }
    setLoading(true);
    const heartbeatInterval = setInterval(() => setProgress((p) => p || "Processing..."), 500);
    try {
      if (!deepfakeDetector.isModelLoaded()) {
        setProgress("Loading model...");
        await Promise.race([
          deepfakeDetector.loadModel(),
          new Promise((_, r) => setTimeout(() => r(new Error("Model load timeout")), 45000)),
        ]);
      }
      setProgress("Analyzing video...");
      const detectionResult: DetectionResult = await Promise.race([
        deepfakeDetector.analyzeVideo(file, setProgress),
        new Promise<DetectionResult>((_, r) => setTimeout(() => r(new Error("Analysis timeout")), 300000)),
      ]);
      setResult({
        label: detectionResult.label || "REAL",
        confidence: detectionResult.confidence,
        source: detectionResult.source,
        videoVerdict: detectionResult.videoVerdict,
      });
      try {
        const formData = new FormData();
        formData.append("video", file);
        const analysisPayload =
          detectionResult.source === "huggingface"
            ? {
                label: detectionResult.label,
                confidence: detectionResult.confidence,
                source: detectionResult.source,
                videoVerdict: detectionResult.videoVerdict,
              }
            : detectionResult;
        formData.append("analysis", JSON.stringify(analysisPayload));
        await fetch(`${API_BASE}/api/videos/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      } catch {
        console.warn("Failed to save to backend");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
      clearInterval(heartbeatInterval);
      setLoading(false);
      setProgress("");
    }
  };

  const handleImageSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setImageError(null);
    setImageResult(null);
    setImageProgress("");
    if (!imageFile) {
      setImageError("Please select an image.");
      return;
    }
    const token = window.localStorage.getItem("realeye_token");
    if (!token) {
      router.push("/signin");
      return;
    }
    setImageLoading(true);
    setImageProgress("Analyzing image...");
    try {
      const formData = new FormData();
      formData.append("file", imageFile);
      const res = await fetch(`${API_BASE}/api/images/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || data?.message || "Image analysis failed");
      const label = data.label || data.classification || "UNKNOWN";
      const confidence = typeof data.score === "number" ? data.score : data.confidence ?? 0;
      setImageResult({ label, confidence });
    } catch (err: unknown) {
      setImageError(err instanceof Error ? err.message : "Image analysis failed.");
    } finally {
      setImageProgress("");
      setImageLoading(false);
    }
  };

  const DropZone = ({
    file: f,
    setFile,
    accept,
    label,
    sublabel,
    icon,
  }: {
    file: File | null;
    setFile: (file: File | null) => void;
    accept: string;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
  }) => (
    <div
      className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors ${
        f ? "border-indigo-300 bg-indigo-50" : "border-indigo-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50"
      }`}
    >
      <input
        type="file"
        accept={accept}
        className="absolute inset-0 z-10 cursor-pointer opacity-0"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      {f ? (
        <div className="text-center">
          <p className="max-w-full truncate px-2 font-medium text-slate-800">{f.name}</p>
          <p className="text-sm text-slate-500">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
          <p className="mt-1 text-xs text-indigo-600">Click to change</p>
        </div>
      ) : (
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">{icon}</div>
          <p className="font-medium text-slate-700">{label}</p>
          <p className="mt-1 text-sm text-slate-500">{sublabel}</p>
        </div>
      )}
    </div>
  );

  const tabBtn = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      active ? "bg-indigo-500/10 text-indigo-700" : "text-slate-600 hover:bg-indigo-50/80 hover:text-slate-900"
    }`;

  return (
    <section className="relative mx-auto min-h-[calc(100vh-80px)] w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
      <VideoDetectorPaymentModal
        open={videoPaymentOpen}
        onClose={() => setVideoPaymentOpen(false)}
        onSuccess={() => {
          setVideoPaymentOpen(false);
          setTab("video");
        }}
      />
      <ImageDetectorPaymentModal
        open={imagePaymentOpen}
        onClose={() => setImagePaymentOpen(false)}
        onSuccess={() => {
          setImagePaymentOpen(false);
          setTab("image");
        }}
      />
      <ProPlanModal open={proPlanOpen} onClose={() => setProPlanOpen(false)} />
      <div className="flex flex-col gap-8 md:flex-row">
        <div className="flex w-full shrink-0 flex-col gap-8 md:w-64">
          <div>
            <h3 className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Tools</h3>
            <nav className="flex flex-col gap-1">
              <button type="button" onClick={() => setTab("intel")} className={`${tabBtn(tab === "intel")} justify-between`}>
                <span className="flex items-center gap-3">
                  <DocumentIcon /> Project Intel
                </span>
                <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">New</span>
              </button>
              <button type="button" onClick={openFakeVideoDetector} className={`${tabBtn(tab === "video")} justify-between`}>
                <span className="flex items-center gap-3">
                  <VideoIcon /> Fake Video Detector
                </span>
              </button>
              <button type="button" onClick={openFakeImageDetector} className={tabBtn(tab === "image")}>
                <ImageIcon /> Fake Image Detector
              </button>
            </nav>
            <p className="mt-3 px-3 text-[11px] leading-relaxed text-slate-500">
              Full Project Intel (same as the standalone page) is also at{" "}
              <button type="button" onClick={() => router.push("/plagiarism")} className="font-semibold text-indigo-600 underline-offset-2 hover:underline">
                /plagiarism
              </button>
              .
            </p>
          </div>
          <div>
            <h3 className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Account</h3>
            <nav className="flex flex-col gap-1">
              <button type="button" onClick={() => router.push("/profile")} className={tabBtn(false)}>
                <SettingsIcon /> Settings
              </button>
              <button type="button" onClick={() => router.push("/chat")} className={tabBtn(false)}>
                <HelpIcon /> Help
              </button>
            </nav>
          </div>

          <div className="mt-auto rounded-xl border border-indigo-100 bg-indigo-50/80 p-4">
            <h4 className="mb-1 font-semibold text-slate-900">Upgrade to Pro</h4>
            <p className="mb-3 text-xs text-slate-600">Unlimited scans, deeper detection, priority queue.</p>
            <button
              type="button"
              onClick={() => setProPlanOpen(true)}
              className="w-full rounded-lg border border-slate-900/15 bg-indigo-600 py-1.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              Try Pro for $0
            </button>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          {tab === "intel" ? (
            <div className="min-w-0 overflow-x-auto">
              <header className="border-b border-indigo-100 pb-4">
                <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold text-slate-900">
                  <DocumentIcon />
                  Project Intel
                </h1>
                <p className="text-slate-600">
                  Similarity intelligence, competitor discovery, SWOT, and strategy — same workflow as the dedicated page.
                </p>
              </header>
              <div className="mt-6">
                <ProjectIntelWorkspace embedded />
              </div>
            </div>
          ) : (
            <div className="flex min-w-0 flex-col gap-8 lg:flex-row">
              <div className="flex min-w-0 flex-1 flex-col gap-6">
                <header className="border-b border-indigo-100 pb-4">
                  <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold text-slate-900">
                    {tab === "video" ? <VideoIcon /> : <ImageIcon />}
                    {tab === "video" ? "Fake Video Detector" : "Fake Image Detector"}
                  </h1>
                  <p className="text-slate-600">
                    Upload a {tab === "video" ? "video" : "image"} — we analyze it {tab === "video" ? "frame-by-frame " : ""}for AI generation or deepfake manipulation.
                  </p>
                </header>

                <div className="flex flex-1 flex-col rounded-2xl border border-indigo-100 bg-white/95 p-6 shadow-sm sm:p-8">
                  {tab === "video" ? (
                    <form onSubmit={handleVideoSubmit} className="flex flex-1 flex-col">
                      <div className="flex-1">
                        {error && (
                          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                        )}
                        <DropZone
                          file={file}
                          setFile={(next) => {
                            setFile(next);
                            setResult(null);
                            setError(null);
                          }}
                          accept="video/*"
                          label="Paste or drop your video here..."
                          sublabel="MP4, MOV, AVI, WebM supported"
                          icon={
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          }
                        />
                        {progress && (
                          <div className="mt-4 flex items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
                            <Spinner />
                            <span>{progress}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-6 flex items-center justify-between border-t border-indigo-100 pt-4">
                        <span className="text-sm text-slate-500">{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "0 files"}</span>
                        <button
                          type="submit"
                          disabled={loading || !file}
                          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {loading ? (
                            <>
                              <Spinner /> Analyzing...
                            </>
                          ) : (
                            "Analyze video"
                          )}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleImageSubmit} className="flex flex-1 flex-col">
                      <div className="flex-1">
                        {imageError && (
                          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{imageError}</div>
                        )}
                        <DropZone
                          file={imageFile}
                          setFile={(next) => {
                            setImageFile(next);
                            setImageResult(null);
                            setImageError(null);
                          }}
                          accept="image/*"
                          label="Paste or drop your image here..."
                          sublabel="JPG, PNG, WebP supported"
                          icon={
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6a2 2 0 11-4 0 2 2 0 014 0zM6 18h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                          }
                        />
                        {imageProgress && (
                          <div className="mt-4 flex items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
                            <Spinner />
                            <span>{imageProgress}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-6 flex items-center justify-between border-t border-indigo-100 pt-4">
                        <span className="text-sm text-slate-500">{imageFile ? `${(imageFile.size / 1024 / 1024).toFixed(2)} MB` : "0 files"}</span>
                        <button
                          type="submit"
                          disabled={imageLoading || !imageFile}
                          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {imageLoading ? (
                            <>
                              <Spinner /> Analyzing...
                            </>
                          ) : (
                            "Analyze image"
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              <div className="flex w-full shrink-0 flex-col gap-6 lg:w-80">
                <div className="rounded-2xl border border-indigo-100 bg-white/95 p-6 shadow-sm">
                  <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Originality Score</h3>

                  {tab === "video" && !result && (
                    <div className="py-6 text-center text-sm text-slate-500">Run a check to see your score.</div>
                  )}
                  {tab === "image" && !imageResult && (
                    <div className="py-6 text-center text-sm text-slate-500">Run a check to see your score.</div>
                  )}

                  {tab === "video" && result && (
                    <ResultCard
                      result={result}
                      mode={
                        result.source === "huggingface"
                          ? `Hugging Face (${result.videoVerdict?.modelsConfigured ?? "—"} models)`
                          : "Local Keras Model"
                      }
                    />
                  )}

                  {tab === "image" && imageResult && <ResultCard result={imageResult} mode="AI Image Analysis" />}
                </div>

                <div className="rounded-2xl border border-indigo-100 bg-white/95 p-6 shadow-sm">
                  <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Recent Reports</h3>
                  {historyLoading ? (
                    <div className="flex justify-center py-4 text-indigo-600">
                      <Spinner />
                    </div>
                  ) : historyError ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{historyError}</div>
                  ) : history.length === 0 ? (
                    <div className="py-4 text-center text-sm text-slate-500">No media history yet.</div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {history.slice(0, 5).map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-3 border-b border-indigo-100 py-2 last:border-0 last:pb-0">
                          <div className="min-w-0">
                            <p className="truncate text-sm text-slate-800">{item.filename}</p>
                            <p className="text-[10px] text-slate-500">{new Date(item.created_at).toLocaleDateString()}</p>
                          </div>
                          <span
                            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                              (item.result || "").toUpperCase() === "FAKE" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {item.result || "REAL"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
