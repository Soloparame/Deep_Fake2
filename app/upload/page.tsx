"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { deepfakeDetector, DetectionResult } from "@/utils/deepfakeDetector";

interface AnalysisResult {
  label: string;
  confidence: number;
}

interface HistoryItem {
  id: string;
  filename: string;
  result: string;
  confidence: number;
  created_at: string;
  type?: string;
}

const Spinner = () => (
  <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const ResultCard = ({ result, mode }: { result: AnalysisResult; mode: string }) => (
  <div className="mt-6 rounded-xl border border-white/10 bg-gray-900/50 p-5">
    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
      <span className={`h-2 w-2 rounded-full animate-pulse ${result.confidence <= 0.6 ? "bg-green-500" : "bg-red-500"}`} />
      Analysis Complete
    </h3>
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm text-gray-400">Result</p>
        <p className={`mt-1 text-2xl font-bold ${result.confidence <= 0.6 ? "text-green-400" : "text-red-400"}`}>
          {result.confidence <= 0.6 ? "REAL" : "FAKE"}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm text-gray-400">Confidence</p>
        <p className="mt-1 font-mono text-2xl font-bold text-white">{(result.confidence * 100).toFixed(1)}%</p>
      </div>
    </div>
    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-800">
      <div
        className={`h-full rounded-full transition-all duration-500 ${result.confidence <= 0.6 ? "bg-green-500" : "bg-red-500"}`}
        style={{ width: `${result.confidence * 100}%` }}
      />
    </div>
    <p className="mt-3 text-xs text-gray-600 font-mono">{mode}</p>
  </div>
);

export default function UploadPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"video" | "image">("video");
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

  useEffect(() => {
    const fetchHistory = async () => {
      const token = window.localStorage.getItem("realeye_token");
      if (!token) return;
      setHistoryLoading(true);
      try {
        const profileRes = await fetch("http://localhost:8000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (profileRes.ok) {
          const profile = await profileRes.json();
          const historyRes = await fetch(
            `http://localhost:8000/api/predictions?user_email=${encodeURIComponent(profile.email)}&limit=15`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (historyRes.ok) {
            const data = await historyRes.json();
            setHistory(data.predictions || []);
          }
        }
      } catch (err) {
        console.error("Failed to load history:", err);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, [result, imageResult]);

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
      setResult({ label: detectionResult.label, confidence: detectionResult.confidence });
      try {
        const formData = new FormData();
        formData.append("video", file);
        formData.append("analysis", JSON.stringify(detectionResult));
        await fetch("http://localhost:8000/api/videos/upload", {
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
      const res = await fetch("http://localhost:8000/api/images/upload", {
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
    file,
    setFile,
    accept,
    label,
    sublabel,
    icon,
  }: {
    file: File | null;
    setFile: (f: File | null) => void;
    accept: string;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
  }) => (
    <div
      className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors ${
        file ? "border-indigo-500/50 bg-indigo-500/5" : "border-white/10 bg-white/5 hover:border-indigo-500/30 hover:bg-white/10"
      }`}
    >
      <input
        type="file"
        accept={accept}
        className="absolute inset-0 z-10 cursor-pointer opacity-0"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      {file ? (
        <div className="text-center">
          <p className="font-medium text-white truncate max-w-full px-2">{file.name}</p>
          <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          <p className="mt-1 text-xs text-indigo-400">Click to change</p>
        </div>
      ) : (
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-800/80 text-indigo-400">
            {icon}
          </div>
          <p className="font-medium text-gray-300">{label}</p>
          <p className="mt-1 text-sm text-gray-500">{sublabel}</p>
        </div>
      )}
    </div>
  );

  return (
    <section className="relative min-h-[calc(100vh-80px)] py-12">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-[20%] top-[20%] h-80 w-80 rounded-full bg-indigo-600/10 blur-[100px]" />
        <div className="absolute right-[20%] bottom-[20%] h-56 w-56 rounded-full bg-violet-600/10 blur-[80px]" />
      </div>

      <div className="container mx-auto max-w-2xl px-4 sm:px-6">
        <h1 className="mb-2 text-center font-nacelle text-3xl font-bold tracking-tight text-white md:text-4xl">
          <span className="bg-gradient-to-r from-indigo-200 via-white to-indigo-200 bg-clip-text text-transparent">
            Upload
          </span>
        </h1>
        <p className="mb-8 text-center text-sm text-indigo-200/60">
          Analyze videos or images for AI-generated or manipulated content
        </p>

        {/* Tabs */}
        <div className="mb-6 flex rounded-xl border border-white/10 bg-gray-950/50 p-1">
          <button
            type="button"
            onClick={() => setTab("video")}
            className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
              tab === "video"
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Video
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTab("image")}
            className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
              tab === "image"
                ? "bg-indigo-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6a2 2 0 11-4 0 2 2 0 014 0zM6 18h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Image Doctor
            </span>
          </button>
        </div>

        {/* Upload Card */}
        <div className="rounded-2xl border border-white/10 bg-gray-950/80 p-6 shadow-xl backdrop-blur-sm">
          {tab === "video" && (
            <form onSubmit={handleVideoSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}
              <DropZone
                file={file}
                setFile={(f) => {
                  setFile(f);
                  setResult(null);
                  setError(null);
                }}
                accept="video/*"
                label="Drop video here"
                sublabel="or click to browse · MP4, MOV, AVI, WebM"
                icon={
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                }
              />
              {progress && (
                <div className="flex items-center gap-3 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-400">
                  <Spinner />
                  <span>{progress}</span>
                </div>
              )}
              <button
                type="submit"
                disabled={loading || !file}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 font-medium text-white transition-all hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner />
                    Analyzing...
                  </span>
                ) : (
                  "Scan Video"
                )}
              </button>
              {result && <ResultCard result={result} mode="Video · TensorFlow" />}
            </form>
          )}

          {tab === "image" && (
            <form onSubmit={handleImageSubmit} className="space-y-4">
              {imageError && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {imageError}
                </div>
              )}
              <DropZone
                file={imageFile}
                setFile={(f) => {
                  setImageFile(f);
                  setImageResult(null);
                  setImageError(null);
                }}
                accept="image/*"
                label="Drop image here"
                sublabel="or click to browse · JPG, PNG, WebP"
                icon={
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6a2 2 0 11-4 0 2 2 0 014 0zM6 18h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />
              {imageProgress && (
                <div className="flex items-center gap-3 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-400">
                  <Spinner />
                  <span>{imageProgress}</span>
                </div>
              )}
              <button
                type="submit"
                disabled={imageLoading || !imageFile}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 font-medium text-white transition-all hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {imageLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner />
                    Analyzing...
                  </span>
                ) : (
                  "Run Image Doctor"
                )}
              </button>
              {imageResult && <ResultCard result={imageResult} mode="Image Doctor · AI Analysis" />}
            </form>
          )}
        </div>

        {/* History */}
        <div className="mt-12">
          <h2 className="mb-4 text-center font-nacelle text-xl font-semibold text-white">
            <span className="bg-gradient-to-r from-indigo-200/90 to-indigo-200/70 bg-clip-text text-transparent">
              Your History
            </span>
          </h2>
          {historyLoading ? (
            <div className="flex justify-center py-8 text-indigo-400">
              <Spinner />
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-xl border border-white/10 px-6 py-8 text-center text-gray-400">
              No analyses yet. Upload a video or image to get started.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/10 p-4 transition-colors hover:border-indigo-500/30 hover:bg-white/5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{item.filename}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.result === "FAKE" || item.confidence > 0.6
                        ? "bg-red-500/10 text-red-400"
                        : "bg-green-500/10 text-green-400"
                    }`}>
                      {item.result === "FAKE" || item.confidence > 0.6 ? "FAKE" : "REAL"}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-500">
                      {item.type === "image" ? "Image" : "Video"}
                    </span>
                    <span className="font-mono text-xs text-gray-400">
                      {(item.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
                    <div
                      className={`h-full transition-all ${
                        item.confidence > 0.6 ? "bg-red-500" : "bg-green-500"
                      }`}
                      style={{ width: `${item.confidence * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
