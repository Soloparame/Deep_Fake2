"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type VideoItem = { id: string; url: string; label: "REAL" | "FAKE" };

export default function CommunityPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = window.localStorage.getItem("realeye_token");
    if (!token) {
      router.push("/signin");
      return;
    }
    fetch("http://localhost:4000/api/community/videos", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load videos");
        const data = await r.json();
        setVideos(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const current = videos[idx];

  const choose = (choice: "REAL" | "FAKE") => {
    if (!current || answered) return;
    const isCorrect = current.label === choice;
    setCorrect(isCorrect);
    setAnswered(true);
    if (isCorrect) setScore((s) => s + 1);
  };

  const next = () => {
    const nextIndex = idx + 1;
    if (nextIndex < videos.length) {
      setIdx(nextIndex);
      setAnswered(false);
      setCorrect(null);
    } else {
      setIdx(nextIndex);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-indigo-200">Loading...</div>
    );
  }

  if (!current) {
    return (
      <section className="relative min-h-screen pt-24 pb-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h1 className="font-nacelle text-3xl md:text-4xl text-white">Community Challenge</h1>
          <p className="text-indigo-200/65">Finished. Score {score}/{videos.length}</p>
          <button
            className="btn bg-indigo-600 text-white mt-4"
            onClick={() => {
              setIdx(0);
              setScore(0);
              setAnswered(false);
              setCorrect(null);
            }}
          >
            Play Again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen pt-24 pb-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="mb-6 text-center">
          <h1 className="font-nacelle text-3xl md:text-4xl text-white">Community Challenge</h1>
          <p className="text-indigo-200/65">Video {idx + 1} of {videos.length} • Score {score}</p>
        </div>
        <div className="rounded-xl border border-white/10 p-4">
          <video src={`http://localhost:4000${current.url}`} controls className="w-full rounded-lg" />
        </div>
        <div className="mt-6 flex justify-center gap-4">
          <button className="btn bg-green-600 text-white" onClick={() => choose("REAL")} disabled={answered}>Real</button>
          <button className="btn bg-red-600 text-white" onClick={() => choose("FAKE")} disabled={answered}>Fake</button>
        </div>
        {answered && (
          <div className={`mt-4 text-center ${correct ? "text-green-400" : "text-red-400"}`}>
            {correct ? "Correct!" : "Wrong!"}
            <div className="mt-3">
              <button className="btn bg-indigo-600 text-white" onClick={next}>Next</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
