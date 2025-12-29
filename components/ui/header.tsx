"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "./logo";
import ProfileModal from "./profile-modal";

export default function Header() {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("realeye_token");
      window.dispatchEvent(new Event("auth-change"));
    }
    setIsAuthed(false);
    router.push("/signin");
  };

  return (
    <header className="fixed top-0 z-30 mt-4 w-full px-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="relative flex h-14 items-center justify-between gap-3 rounded-full bg-gray-900/60 px-4 shadow-lg ring-1 ring-white/10 backdrop-blur-xl transition-all hover:bg-gray-900/70">
          {/* Site branding */}
          <div className="flex flex-1 items-center">
            <Logo />
          </div>

          {/* Desktop links */}
          <ul className="flex flex-1 items-center justify-end gap-3">
            {!isAuthed && (
              <>
                <li>
                  <Link
                    href="/signin"
                    className="btn-sm text-sm font-medium text-gray-300 transition-colors hover:text-white"
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
                    href="/chat"
                    className="rounded-full px-4 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    Chat
                  </Link>
                </li>
                <li>
                  <Link
                    href="/upload"
                    className="rounded-full px-4 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    Upload Video
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen(true)}
                    className="btn-sm flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/30"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </header>
  );
}
