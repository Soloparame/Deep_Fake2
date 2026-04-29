"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "./logo";

export default function Header() {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      // Small timeout to ensure local storage is updated
      setTimeout(() => {
        if (typeof window === "undefined") return;
        const token = window.localStorage.getItem("realeye_token");
        setIsAuthed(!!token);
      }, 50);
    };

    checkAuth();
    // Listen for custom event AND standard storage event (cross-tab support)
    window.addEventListener("auth-change", checkAuth);
    window.addEventListener("storage", checkAuth);

    return () => {
      window.removeEventListener("auth-change", checkAuth);
      window.removeEventListener("storage", checkAuth);
    };
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("realeye_token");
      window.dispatchEvent(new Event("auth-change"));
    }
    setIsAuthed(false);
    setMobileOpen(false);
    router.push("/signin");
  };

  return (
    <header className="fixed top-0 z-30 mt-4 w-full px-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="relative flex h-14 items-center justify-between gap-3 rounded-full border border-indigo-200/60 bg-white/80 px-4 shadow-sm shadow-indigo-200/60 ring-1 ring-indigo-100 backdrop-blur-xl transition-all hover:bg-white md:h-14">
          {/* Site branding */}
          <div className="flex flex-1 items-center">
            <Logo />
          </div>

          {/* Desktop links */}
          <ul className="hidden flex-1 items-center justify-end gap-3 md:flex">
            {!isAuthed && (
              <>
                <li>
                  <Link
                    href="/"
                    className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-indigo-50 hover:text-slate-900"
                  >
                    Product
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pages/how-it-works"
                    className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-indigo-50 hover:text-slate-900"
                  >
                    How it works
                  </Link>
                </li>
                <li>
                  <Link
                    href="/signin"
                    className="btn-sm text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    href="/signup"
                    className="btn-sm rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/30"
                  >
                    Register
                  </Link>
                </li>
              </>
            )}
            {isAuthed && (
              <>
                <li>
                  <Link
                    href="/community"
                    className="rounded-full px-4 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-indigo-50 hover:text-slate-900"
                  >
                    Community
                  </Link>
                </li>
                <li>
                  <Link
                    href="/chat"
                    className="rounded-full px-4 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-indigo-50 hover:text-slate-900"
                  >
                    Chat
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tools"
                    className="rounded-full px-4 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-indigo-50 hover:text-slate-900"
                  >
                    Tools
                  </Link>
                </li>
                <li>
                  <Link
                    href="/plagiarism"
                    className="rounded-full px-4 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-indigo-50 hover:text-slate-900"
                  >
                    Project Intel
                  </Link>
                </li>
                <li>
                  <Link
                    href="/profile"
                    className="btn-sm flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/30"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </Link>
                </li>
              </>
            )}
          </ul>

          {/* Mobile menu button */}
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 text-slate-600 transition hover:bg-indigo-100 hover:text-slate-900 md:hidden"
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu panel */}
        {mobileOpen && (
          <div className="mt-3 overflow-hidden rounded-2xl border border-indigo-200 bg-white/95 p-2 shadow-xl ring-1 ring-indigo-100 backdrop-blur-xl md:hidden">
            {!isAuthed ? (
              <div className="grid gap-1">
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-slate-900"
                >
                  Product
                </Link>
                <Link
                  href="/pages/how-it-works"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-slate-900"
                >
                  How it works
                </Link>
                <Link
                  href="/signin"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-slate-900"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl bg-indigo-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
                >
                  Register
                </Link>
              </div>
            ) : (
              <div className="grid gap-1">
                <Link
                  href="/community"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-gray-200 transition hover:bg-white/[0.06] hover:text-white"
                >
                  Community
                </Link>
                <Link
                  href="/chat"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-gray-200 transition hover:bg-white/[0.06] hover:text-white"
                >
                  Chat
                </Link>
                <Link
                  href="/tools"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-slate-900"
                >
                  Tools
                </Link>
                <Link
                  href="/plagiarism"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-gray-200 transition hover:bg-white/[0.06] hover:text-white"
                >
                  Project Intel
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-gray-200 transition hover:bg-white/[0.06] hover:text-white"
                >
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
