"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
// Placeholder imports to satisfy TS – replace with real detector module when available
// const deepfakeDetector = {
//   isModelLoaded: () => false,
//   loadModel: () => Promise.resolve(),
//   analyzeVideo: (file: File, cb?: (msg: string) => void) =>
//     Promise.resolve({ label: "real", confidence: 0.95 } as DetectionResult),
// };
// interface DetectionResult { label: string; confidence: number; }

interface AnalysisResult {
  label: string;
  confidence: number;
}

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [progress, setProgress] = useState<string>("");
  const [modelLoading, setModelLoading] = useState(false);
  const [heartbeat, setHeartbeat] = useState(0);

  // Don't preload model - load only when user uploads video to keep page responsive
  // Model will be loaded on-demand when user clicks "Initiate Scan"

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
    
    // Start heartbeat to show page is still responsive
    const heartbeatInterval = setInterval(() => {
      setHeartbeat(prev => prev + 1);
      // Force UI update to show responsiveness
      if (document.activeElement) {
        (document.activeElement as HTMLElement).blur();
        setTimeout(() => {
          if (document.body) {
            document.body.focus();
            document.body.blur();
          }
        }, 0);
      }
    }, 500);
    
    try {
      // Check if model is already loaded
      if (!deepfakeDetector.isModelLoaded()) {
        // Add retry/timeout handling for slow or flaky connections
        const ensureModelLoaded = async (attempts = 3, timeoutMs = 180000) => {
          let lastErr: any = null;
          for (let attempt = 1; attempt <= attempts; attempt++) {
            setModelLoading(true);
            setProgress(`Downloading AI model (~80MB)... attempt ${attempt}/${attempts}. This may take a few minutes.`);
            try {
              const loadPromise = deepfakeDetector.loadModel();
              let timeoutId: any;
              const timeoutPromise = new Promise<never>((_, reject) => {
                timeoutId = setTimeout(() => reject(new Error(`Model loading timeout (${Math.round(timeoutMs/60000)} mins) - please check your connection and retry`)), timeoutMs);
              });

              try {
                await Promise.race([loadPromise, timeoutPromise]);
                clearTimeout(timeoutId);
                setProgress("Model loaded! Starting video analysis...");
                setModelLoading(false);
                return;
              } finally {
                clearTimeout(timeoutId);
              }
            } catch (err: any) {
              lastErr = err;
              console.warn(`Model load attempt ${attempt} failed:`, err);
              setProgress(`Model load attempt ${attempt} failed. ${attempt < attempts ? 'Retrying...' : 'Please try again.'}`);
              setModelLoading(false);
              if (attempt < attempts) {
                // Backoff before retrying
                await new Promise(r => setTimeout(r, 1500 * attempt));
                continue;
              } else {
                throw lastErr;
              }
            }
          }
        };

        try {
          await ensureModelLoaded(3, 180000);
        } catch (loadError: any) {
          throw new Error(`Failed to load model: ${loadError.message || loadError}. You can try again without refreshing by clicking "Initiate Scan" again.`);
        }
      } else {
        setProgress("Model ready! Starting video analysis...");
      }
      
      const detectionResult: DetectionResult = await Promise.race([
        deepfakeDetector.analyzeVideo(file, (message) => {
          setProgress(message);
        }),
        new Promise<DetectionResult>((_, reject) => {
          setTimeout(() => {
            reject(new Error('Analysis timeout after 120 seconds. The video may be too large or the model is taking too long. Please try a shorter video.'));
          }, 120000);
        })
      ]);
      
      setProgress("Analysis complete!");
      
      // Convert to the expected format
      setResult({
        label: detectionResult.label,
        confidence: detectionResult.confidence,
      });

      // Optionally save to backend for history
      try {
        const formData = new FormData();
        formData.append("video", file);
        formData.append("analysis", JSON.stringify({
          label: detectionResult.label,
          confidence: detectionResult.confidence,
        }));
        
        await fetch("http://localhost:4000/api/videos/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
      } catch (backendErr) {
        // Backend save is optional, don't fail if it errors
        console.warn("Failed to save to backend:", backendErr);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Analysis failed. Please try again.");
    } finally {
      clearInterval(heartbeatInterval);
      setLoading(false);
      setProgress("");
      setHeartbeat(0);
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
                    disabled={loading || modelLoading}
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
                          ID: {Math.random().toString(36).substr(2, 9).toUpperCase()} | MODEL: TensorFlow.js | Real-time Analysis
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
