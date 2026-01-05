"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

interface AnalysisResult {
  label: string;
  confidence: number;
}

interface DetectionResponse {
  result: "REAL" | "FAKE";
  confidence: number;
}

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [progress, setProgress] = useState<string>("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setProgress("");

    if (!file) {
      setError("Please select a video file first.");
      return;
    }

    const token = window.localStorage.getItem("realeye_token");
    if (!token) {
      router.push("/signin");
      return;
    }

    setLoading(true);
    setProgress("Uploading video to server...");
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("file", file);
      
      setProgress("Processing video with AI model...");
      
      // Call backend API endpoint
      const response = await fetch("http://localhost:4000/api/detect-video", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }

      const detectionResult: DetectionResponse = await response.json();
      
      setProgress("Analysis complete!");
      
      // Convert backend response format to frontend format
      // Backend returns: { result: "REAL"|"FAKE", confidence: 0.95 }
      // Frontend expects: { label: "real"|"fake", confidence: 0.95 }
      setResult({
        label: detectionResult.result.toLowerCase(),
        confidence: detectionResult.confidence,
      });

    } catch (err: any) {
      console.error("Detection error:", err);
      setError(err.message || "Analysis failed. Please make sure the backend server is running on http://localhost:4000");
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  return (
    <section className="relative flex min-h-[calc(100vh-80px)] items-center justify-center overflow-hidden py-12">
      {/* Background Decor */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-[20%] top-[20%] h-96 w-96 rounded-full bg-indigo-600/10 blur-[100px] animate-pulse"></div>
        <div className="absolute right-[20%] bottom-[20%] h-64 w-64 rounded-full bg-violet-600/10 blur-[80px]"></div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">

          {/* Left Column: Intro & Context */}
          <div className="text-center lg:text-left">
            <h1 className="mb-6 font-nacelle text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
              <span className="bg-gradient-to-r from-indigo-200 via-white to-indigo-200 bg-clip-text text-transparent">
                Deepfake Analysis
              </span>
            </h1>
            <p className="mb-8 text-lg leading-relaxed text-indigo-200/70">
              Upload your video content to our advanced neural network.
              We'll analyze frame-by-frame artifacts to detect synthetic manipulation with high precision.
            </p>

            <div className="flex flex-wrap justify-center gap-4 lg:justify-start">
              <div className="flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-4 py-2 text-sm text-indigo-200/80 backdrop-blur-sm">
                <svg className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                99.8% Accuracy
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-4 py-2 text-sm text-indigo-200/80 backdrop-blur-sm">
                <svg className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Real-time Processing
              </div>
            </div>
          </div>

          {/* Right Column: The Scanner */}
          <div className="relative">
            {/* Decorative Ring */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500 to-violet-500 opacity-20 blur-lg transition duration-200 group-hover:opacity-40"></div>

            <div className="glass-card relative overflow-hidden rounded-3xl border border-white/10 p-1">
              <div className="rounded-2xl bg-gray-950/80 p-6 sm:p-8">

                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="animate-fade-in rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                      ⚠️ {error}
                    </div>
                  )}

                  <div className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-white/5 px-6 py-12 transition-all hover:border-indigo-500/50 hover:bg-white/10 ${file ? 'border-indigo-500/50 bg-indigo-500/5' : ''}`}>
                    <input
                      type="file"
                      accept="video/*"
                      className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setFile(f);
                        setResult(null);
                        setError(null);
                      }}
                    />

                    {file ? (
                      <div className="text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="truncate px-4 font-medium text-white">{file.name}</p>
                        <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        <p className="mt-2 text-xs text-indigo-400">Click to change</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-800 text-gray-400 transition-colors group-hover:bg-gray-700">
                          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                        </div>
                        <p className="text-lg font-medium text-gray-300">Drop video here</p>
                        <p className="mt-1 text-sm text-gray-500">or click to browse</p>
                      </div>
                    )}
                  </div>


                  {progress && (
                    <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-4 text-sm text-indigo-400">
                      <div className="flex items-center gap-3">
                        <svg className="h-5 w-5 animate-spin text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <div className="flex-1">
                          <p className="font-medium">{progress}</p>
                          {loading && (
                            <p className="mt-1 text-xs text-indigo-300/70">
                              {progress.includes("worker") || progress.includes("Worker") 
                                ? "✓ Using AI worker - page will remain responsive!" 
                                : "Processing in background - please wait..."}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="group relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 font-medium text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] disabled:opacity-70 disabled:hover:scale-100"
                    disabled={loading}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {loading ? (
                        <>
                          <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Analyzing Neural Patterns...
                        </>
                      ) : "Initiate Scan"}
                    </span>
                    {/* Button Shine Effect */}
                    <div className="absolute inset-0 -translate-x-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-[100%]"></div>
                  </button>
                </form>

                {/* Analysis Result */}
                {result && (
                  <div className="mt-8 animate-[fadeIn_0.5s_ease-out]">
                    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gray-900 p-1">
                      {/* Scanning Line Animation */}
                      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_bottom,transparent,rgba(79,70,229,0.1),transparent)] animate-[scan_2s_linear_infinite] h-[20%] w-full"></div>

                      <div className="relative z-10 bg-gray-950/50 p-5">
                        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
                          <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                          Analysis Complete
                        </h3>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-400">Detection Result</p>
                            <p className={`mt-1 text-3xl font-bold tracking-tight ${result.label.toLowerCase() === 'real' ? 'text-green-400' : 'text-red-400'}`}>
                              {result.label.toUpperCase()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-400">Confidence Score</p>
                            <p className="mt-1 font-mono text-3xl font-bold text-white">{(result.confidence * 100).toFixed(1)}%</p>
                          </div>
                        </div>

                        {/* Progress Bar Visualization */}
                        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-800">
                          <div
                            className={`h-full rounded-full ${result.label.toLowerCase() === 'real' ? 'bg-green-500' : 'bg-red-500'} transition-all duration-1000 ease-out`}
                            style={{ width: `${result.confidence * 100}%` }}
                          ></div>
                        </div>

                        <p className="mt-4 text-xs text-gray-600 font-mono">
                          ID: {Math.random().toString(36).substr(2, 9).toUpperCase()} | MODEL: Server (Keras) | Real-time Analysis
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
