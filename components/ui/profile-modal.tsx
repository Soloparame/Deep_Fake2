"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  company: string | null;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");
  
  // Password change form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadUserInfo();
    }
  }, [isOpen]);

  const loadUserInfo = async () => {
    const token = window.localStorage.getItem("realeye_token");
    if (!token) {
      router.push("/signin");
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/api/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        router.push("/signin");
        return;
      }
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Server returned ${res.status}`);
      }
      const data = await res.json();
      setUser(data.user);
      setError(null);
    } catch (err: any) {
      console.error("Failed to load user info:", err);
      if (err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")) {
        setError("Backend server is not running. Please start it with 'npm run server' in a separate terminal.");
      } else {
        setError(err.message || "Failed to load user information. Please check if the backend server is running.");
      }
    }
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    const token = window.localStorage.getItem("realeye_token");
    if (!token) {
      router.push("/signin");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/user/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (res.status === 401) {
        setError("Current password is incorrect");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          setError("Current password is incorrect");
          return;
        }
        throw new Error(data.message || `Server returned ${res.status}`);
      }

      setSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error("Failed to update password:", err);
      if (err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")) {
        setError("Backend server is not running. Please start it with 'npm run server' in a separate terminal.");
      } else {
        setError(err.message || "Failed to update password. Please check if the backend server is running.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("realeye_token");
      window.dispatchEvent(new Event("auth-change"));
    }
    onClose();
    router.push("/signin");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-gray-900/95 p-6 shadow-2xl backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6 border-b border-white/5 pb-4">
          <h2 className="font-nacelle text-2xl font-semibold text-white">Profile Settings</h2>
          <p className="mt-1 text-sm text-gray-400">Manage your account information and security</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-white/5">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "profile"
                ? "border-b-2 border-indigo-500 text-indigo-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "password"
                ? "border-b-2 border-indigo-500 text-indigo-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Change Password
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-400">
            {success}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            {user ? (
              <>
                <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Name</label>
                  <p className="mt-1 text-lg font-medium text-white">{user.name}</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Email</label>
                  <p className="mt-1 text-lg font-medium text-white">{user.email}</p>
                </div>
                {user.company && (
                  <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Company</label>
                    <p className="mt-1 text-lg font-medium text-white">{user.company}</p>
                  </div>
                )}
                <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">User ID</label>
                  <p className="mt-1 font-mono text-sm text-gray-400">{user.id}</p>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 animate-spin text-indigo-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="mt-4 text-sm text-gray-400">Loading user information...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Password Tab */}
        {activeTab === "password" && (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-gray-950/50 px-4 py-3 text-white placeholder:text-gray-600 focus:border-indigo-500/50 focus:outline-none focus:ring-0"
                placeholder="Enter current password"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-gray-950/50 px-4 py-3 text-white placeholder:text-gray-600 focus:border-indigo-500/50 focus:outline-none focus:ring-0"
                placeholder="Enter new password (min. 6 characters)"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-gray-950/50 px-4 py-3 text-white placeholder:text-gray-600 focus:border-indigo-500/50 focus:outline-none focus:ring-0"
                placeholder="Confirm new password"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white transition-all hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
          <button
            onClick={handleLogout}
            className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-500/20"
          >
            Log Out
          </button>
          <button
            onClick={onClose}
            className="rounded-xl bg-gray-800 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

