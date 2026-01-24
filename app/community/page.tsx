 "use client";
 
 import { useEffect, useMemo, useState } from "react";
 import Link from "next/link";
 import { useRouter } from "next/navigation";
 
 type Guess = "REAL" | "FAKE";
 
 interface VoteResult {
   correct?: boolean;
   duplicate?: boolean;
   model_label?: string;
   model_score?: number;
 }
 
 export default function CommunityPage() {
   const router = useRouter();
   const [videos, setVideos] = useState<string[]>([]);
   const [idx, setIdx] = useState(0);
   const [busy, setBusy] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [attempts, setAttempts] = useState(0);
   const [correct, setCorrect] = useState(0);
   const [lastVerdict, setLastVerdict] = useState<{ you: Guess | null; model: "REAL" | "FAKE" | null; score?: number } | null>(null);
 
   const currentUrl = useMemo(() => videos[idx] || null, [videos, idx]);
 
   useEffect(() => {
     const sAttempts = parseInt(window.localStorage.getItem("community_attempts") || "0", 10);
     const sCorrect = parseInt(window.localStorage.getItem("community_correct") || "0", 10);
     if (!Number.isNaN(sAttempts)) setAttempts(sAttempts);
     if (!Number.isNaN(sCorrect)) setCorrect(sCorrect);
   }, []);
 
   useEffect(() => {
     const load = async () => {
       setError(null);
       try {
         const res = await fetch("http://localhost:4000/api/videos/list");
         if (!res.ok) throw new Error(`Failed to load videos (${res.status})`);
         const arr = (await res.json()) as string[];
        if (Array.isArray(arr) && arr.length >= 12) {
          setVideos(arr);
          setIdx(0);
          return;
        }
        await fetch("http://localhost:4000/api/videos/import-dir", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dir: null, limit: 100, recursive: true }),
        }).catch(() => {});
        const res2 = await fetch("http://localhost:4000/api/videos/list");
        const arr2 = (await res2.json()) as string[];
        if (Array.isArray(arr2) && arr2.length >= 12) {
          setVideos(arr2);
          setIdx(0);
          return;
        }
        await fetch("http://localhost:4000/api/videos/seed-ambiguous", { method: "POST" }).catch(() => {});
        const res3 = await fetch("http://localhost:4000/api/videos/list");
        const arr3 = (await res3.json()) as string[];
        setVideos(arr3 || []);
        setIdx(0);
       } catch (e: any) {
         setError(e?.message || "Failed to load community videos");
       }
     };
     load();
   }, []);
 
   const nextVideo = () => {
     if (videos.length === 0) return;
     setIdx((prev) => {
       const n = (prev + 1) % videos.length;
       return n;
     });
   };
 
   const handleGuess = async (g: Guess) => {
     if (!currentUrl) {
       setError("No videos available.");
       return;
     }
     setBusy(true);
     setError(null);
     try {
       const headers: Record<string, string> = {};
       try {
         const uid = window.localStorage.getItem("realeye_email") || "anonymous";
         headers["X-User-Id"] = uid;
       } catch {}
       const res = await fetch("http://localhost:4000/api/community/vote", {
         method: "POST",
         headers: { "Content-Type": "application/json", ...headers },
         body: JSON.stringify({ video_url: currentUrl, vote: g }),
       });
       const data = (await res.json()) as VoteResult;
       const isDuplicate = !!data.duplicate;
       const isCorrect = !!data.correct;
       const modelLabel = (data.model_label as "REAL" | "FAKE") || null;
       const modelScore = typeof data.model_score === "number" ? data.model_score : undefined;
       if (!isDuplicate) {
         const newAttempts = attempts + 1;
         const newCorrect = correct + (isCorrect ? 1 : 0);
         setAttempts(newAttempts);
         setCorrect(newCorrect);
         window.localStorage.setItem("community_attempts", String(newAttempts));
         window.localStorage.setItem("community_correct", String(newCorrect));
       }
       setLastVerdict({ you: g, model: modelLabel, score: modelScore });
       setTimeout(() => {
         setLastVerdict(null);
         nextVideo();
       }, 800);
     } catch (e: any) {
       setError(e?.message || "Failed to analyze video");
     } finally {
       setBusy(false);
     }
   };
 
   const ratio = attempts > 0 ? `${correct}/${attempts}` : "0/0";
 
   return (
     <section className="relative mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-start gap-6 px-4 pt-28">
       <div className="flex w-full items-center justify-between">
         <h1 className="text-2xl font-semibold text-white">Human vs AI</h1>
         <Link href="/" className="text-sm text-indigo-400 hover:text-indigo-300">
           Back to Home
         </Link>
       </div>
 
       <div className="w-full rounded-xl border border-white/10 bg-gray-900/60 p-4 shadow-lg backdrop-blur">
         <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
           {currentUrl ? (
             <video key={currentUrl} src={currentUrl} controls autoPlay className="h-full w-full object-contain" />
           ) : (
             <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">No videos available</div>
           )}
         </div>
 
         <div className="mt-4 flex items-center justify-center gap-4">
           <button
             onClick={() => handleGuess("REAL")}
             disabled={busy || !currentUrl}
             className="rounded-full bg-green-600 px-6 py-2 text-sm font-medium text-white shadow-lg shadow-green-500/20 transition-all hover:bg-green-500 disabled:opacity-50"
           >
             Real
           </button>
           <button
             onClick={() => handleGuess("FAKE")}
             disabled={busy || !currentUrl}
             className="rounded-full bg-pink-600 px-6 py-2 text-sm font-medium text-white shadow-lg shadow-pink-500/20 transition-all hover:bg-pink-500 disabled:opacity-50"
           >
             AI-generated
           </button>
           <button
             onClick={nextVideo}
             disabled={busy || videos.length === 0}
             className="rounded-full bg-gray-700 px-5 py-2 text-sm font-medium text-white transition-all hover:bg-gray-600 disabled:opacity-50"
           >
             Next
           </button>
         </div>
 
         <div className="mt-4 flex items-center justify-between">
           <div className="text-sm text-gray-300">
             Score: <span className="font-semibold text-white">{ratio}</span>
           </div>
           {lastVerdict && (
             <div className="flex items-center gap-3 text-sm">
               <span className="rounded-full bg-white/10 px-3 py-1 text-gray-200">You: {lastVerdict.you}</span>
               {lastVerdict.model && (
                 <span className="rounded-full bg-white/10 px-3 py-1 text-gray-200">
                   Model: {lastVerdict.model}
                   {typeof lastVerdict.score === "number" ? ` (${(lastVerdict.score * 100).toFixed(1)}%)` : ""}
                 </span>
               )}
             </div>
           )}
         </div>
 
         {error && (
           <div className="mt-3 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">
             {error}
           </div>
         )}
       </div>
 
       <div className="flex w-full items-center justify-between text-xs text-gray-400">
         <div>Available videos: {videos.length}</div>
         <div>Tip: Guess updates instantly and moves to the next video.</div>
       </div>
     </section>
   );
 }
 
