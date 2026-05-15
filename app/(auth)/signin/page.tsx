"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.detail || data?.message || `Failed to sign in (${res.status})`;
        setError(msg);
        return;
      }
      if (data.access_token) {
        window.localStorage.setItem("realeye_token", data.access_token);
        window.dispatchEvent(new Event("auth-change"));
        setTimeout(() => window.dispatchEvent(new Event("auth-change")), 100);
        router.push("/");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden">
      {/* Glow effect behind card */}
      <div className="absolute left-1/2 top-1/2 -z-10 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/20 blur-[120px]"></div>

      <div className="mx-auto w-full max-w-[420px] rounded-3xl border border-indigo-100 bg-white/90 p-8 shadow-xl backdrop-blur-2xl">
        {/* Section header */}
        <div className="mb-8 text-center">
          <h1 className="font-nacelle text-3xl font-semibold text-slate-900 md:text-4xl">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-indigo-200/60">
            Enter your credentials to access the secure area
          </p>
        </div>

        {/* Contact form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}
            <div className="group relative">
              <label
                className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500 transition-colors group-focus-within:text-indigo-400"
                htmlFor="email"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                className="w-full rounded-xl border border-indigo-100 bg-white px-4 py-3 text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-200/60"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="group relative">
              <div className="mb-1 flex items-center justify-between gap-3">
                <label
                  className="block text-xs font-medium uppercase tracking-wider text-gray-500 transition-colors group-focus-within:text-indigo-400"
                  htmlFor="password"
                >
                  Password
                </label>
                <Link
                  className="text-xs text-gray-500 hover:text-indigo-400 hover:underline transition-colors"
                  href="/reset-password"
                >
                  Forgot?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                className="w-full rounded-xl border border-indigo-100 bg-white px-4 py-3 text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-200/60"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="mt-8 space-y-4">
            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-t from-indigo-600 to-indigo-500 px-4 py-3 font-medium text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] hover:shadow-indigo-500/40 disabled:opacity-60 disabled:hover:scale-100"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
        {/* Bottom link */}
        <div className="mt-6 text-center text-sm text-gray-400">
          Don't have an account?{" "}
          <Link className="font-medium text-indigo-400 transition-colors hover:text-indigo-300" href="/signup">
            Sign Up
          </Link>
        </div>
      </div>
    </section>
  );
}
