"use client";

import Link from "next/link";
import { FormEvent, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  // If token exists, show reset form; otherwise show forgot password form
  useEffect(() => {
    if (token) {
      setResetToken(token);
    }
  }, [token]);

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.detail || data.message || "Failed to send reset email");
        return;
      }
      
      // Show success message with reset link (in production, this would be in email)
      setSuccess(true);
      if (data.reset_link) {
        setError(null);
        // In production, don't show the link - it should be in email
        console.log("Reset link:", data.reset_link);
      }
    } catch (err: any) {
      setError(err.message || "Failed to request password reset");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!resetToken) {
      setError("Reset token is missing");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, new_password: newPassword }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.detail || data.message || "Failed to reset password");
        return;
      }
      
      setSuccess(true);
      setTimeout(() => {
        router.push("/signin");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (resetToken) {
    // Show reset password form
    return (
      <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -z-10 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/20 blur-[120px]"></div>

        <div className="glass-card mx-auto w-full max-w-[420px] rounded-3xl p-8 backdrop-blur-2xl">
          <div className="mb-8 text-center">
            <h1 className="bg-gradient-to-r from-gray-200 via-indigo-200 to-gray-200 bg-clip-text font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
              Reset Password
            </h1>
            <p className="mt-2 text-sm text-indigo-200/60">
              Enter your new password below
            </p>
          </div>

          <form onSubmit={handleResetPassword}>
            <div className="space-y-5">
              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
                  Password reset successfully! Redirecting to sign in...
                </div>
              )}
              <div className="group relative">
                <label
                  className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500 transition-colors group-focus-within:text-indigo-400"
                  htmlFor="newPassword"
                >
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  className="w-full rounded-xl border border-white/10 bg-gray-950/50 px-4 py-3 text-gray-200 outline-none transition-all placeholder:text-gray-600 focus:border-indigo-500/50 focus:bg-gray-950/80 focus:ring-4 focus:ring-indigo-500/10"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div className="group relative">
                <label
                  className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500 transition-colors group-focus-within:text-indigo-400"
                  htmlFor="confirmPassword"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="w-full rounded-xl border border-white/10 bg-gray-950/50 px-4 py-3 text-gray-200 outline-none transition-all placeholder:text-gray-600 focus:border-indigo-500/50 focus:bg-gray-950/80 focus:ring-4 focus:ring-indigo-500/10"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
            </div>
            <div className="mt-8">
              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-t from-indigo-600 to-indigo-500 px-4 py-3 font-medium text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] hover:shadow-indigo-500/40 disabled:opacity-60 disabled:hover:scale-100"
                disabled={loading || success}
              >
                {loading ? "Resetting..." : success ? "Success!" : "Reset Password"}
              </button>
            </div>
          </form>
          <div className="mt-6 text-center text-sm text-gray-400">
            Remember your password?{" "}
            <Link className="font-medium text-indigo-400 transition-colors hover:text-indigo-300" href="/signin">
              Sign In
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // Show forgot password form
  return (
    <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden">
      <div className="absolute left-1/2 top-1/2 -z-10 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/20 blur-[120px]"></div>

      <div className="glass-card mx-auto w-full max-w-[420px] rounded-3xl p-8 backdrop-blur-2xl">
        <div className="mb-8 text-center">
          <h1 className="bg-gradient-to-r from-gray-200 via-indigo-200 to-gray-200 bg-clip-text font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
            Forgot Password
          </h1>
          <p className="mt-2 text-sm text-indigo-200/60">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <form onSubmit={handleForgotPassword}>
          <div className="space-y-5">
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
                If an account exists with this email, a reset link has been sent. Please check your email.
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
                className="w-full rounded-xl border border-white/10 bg-gray-950/50 px-4 py-3 text-gray-200 outline-none transition-all placeholder:text-gray-600 focus:border-indigo-500/50 focus:bg-gray-950/80 focus:ring-4 focus:ring-indigo-500/10"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="mt-8">
            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-t from-indigo-600 to-indigo-500 px-4 py-3 font-medium text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] hover:shadow-indigo-500/40 disabled:opacity-60 disabled:hover:scale-100"
              disabled={loading || success}
            >
              {loading ? "Sending..." : success ? "Email Sent!" : "Send Reset Link"}
            </button>
          </div>
        </form>
        <div className="mt-6 text-center text-sm text-gray-400">
          Remember your password?{" "}
          <Link className="font-medium text-indigo-400 transition-colors hover:text-indigo-300" href="/signin">
            Sign In
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
