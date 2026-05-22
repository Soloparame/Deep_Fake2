"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";

const inputClassName =
  "w-full rounded-xl border border-indigo-100 bg-white px-4 py-3 text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-200/60";

const labelClassName =
  "mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500 transition-colors group-focus-within:text-indigo-400";

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(apiUrl("/api/auth/signup"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, company, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to sign up");
      }
      if (data.access_token) {
        window.localStorage.setItem("realeye_token", data.access_token);
        window.dispatchEvent(new Event("auth-change"));
      }
      router.push("/");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Sign-up failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden">
      <div className="absolute left-1/2 top-1/2 -z-10 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/20 blur-[120px]"></div>

      <div className="mx-auto w-full max-w-[420px] rounded-3xl border border-indigo-100 bg-white/90 p-8 shadow-xl backdrop-blur-2xl">
        <div className="mb-8 text-center">
          <h1 className="font-nacelle text-3xl font-semibold text-slate-900 md:text-4xl">
            Create an account
          </h1>
          <p className="mt-2 text-sm text-indigo-200/60">
            Enter your details to get started with the secure area
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}
            <div className="group relative">
              <label className={labelClassName} htmlFor="name">
                Name
              </label>
              <input
                id="name"
                type="text"
                className={inputClassName}
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="group relative">
              <label className={labelClassName} htmlFor="company">
                Company name
              </label>
              <input
                id="company"
                type="text"
                className={inputClassName}
                placeholder="Your company (optional)"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            <div className="group relative">
              <label className={labelClassName} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className={inputClassName}
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="group relative">
              <label className={labelClassName} htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className={inputClassName}
                placeholder="At least 10 characters"
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
              {loading ? "Creating account..." : "Register"}
            </button>
            <div className="flex items-center gap-3 text-center text-sm text-gray-400 before:h-px before:flex-1 before:bg-indigo-100 after:h-px after:flex-1 after:bg-indigo-100">
              <span className="shrink-0">or</span>
            </div>
            <button
              type="button"
              className="w-full rounded-xl border border-indigo-100 bg-white px-4 py-3 font-medium text-slate-600 transition-all hover:border-indigo-200 hover:bg-indigo-50/50"
            >
              Sign up with Google (coming soon)
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link
            className="font-medium text-indigo-400 transition-colors hover:text-indigo-300"
            href="/signin"
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
