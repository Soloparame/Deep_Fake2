"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface UserProfile {
    email: string;
    name?: string;
    created_at?: string;
    last_login?: string;
}

interface UserStats {
    total_chats: number;
    total_predictions?: number;
    total_images?: number;
    total_videos?: number;
    total_analyses?: number;
    last_prediction?: unknown;
    last_chat_session?: unknown;
}

export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("identity");
    const [pwdCurrent, setPwdCurrent] = useState("");
    const [pwdNew, setPwdNew] = useState("");
    const [pwdMsg, setPwdMsg] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfileData = async () => {
            const token = window.localStorage.getItem("realeye_token");
            if (!token) {
                router.push("/signin");
                return;
            }

            try {
                const userRes = await fetch(`${API_BASE}/api/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (userRes.ok) {
                    const userData = await userRes.json();
                    setProfile(userData);
                }

                try {
                    const statsRes = await fetch(`${API_BASE}/api/user/stats`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (statsRes.ok) {
                        setStats(await statsRes.json());
                    }
                } catch {
                    /* Stats are optional; ignore network errors (e.g. dev reload, CORS timing). */
                }
            } catch (err) {
                console.error("Failed to load profile", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [router]);

    const handleLogout = () => {
        window.localStorage.removeItem("realeye_token");
        window.dispatchEvent(new Event("auth-change"));
        router.push("/signin");
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="animate-pulse text-xl font-semibold text-indigo-400">Loading profile...</div>
            </div>
        );
    }

    const tabs = [
        { id: "identity", label: "Identity", icon: "👤" },
        { id: "security", label: "Security", icon: "🔒" },
        { id: "data", label: "Data", icon: "💾" },
        { id: "preferences", label: "Preferences", icon: "⚙️" },
    ];

    return (
        <section className="relative min-h-screen overflow-hidden pt-24 pb-12">
            {/* Background Decor - consistent with upload page */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute left-[20%] top-[20%] h-96 w-96 rounded-full bg-indigo-600/10 blur-[100px] animate-pulse"></div>
                <div className="absolute right-[20%] bottom-[20%] h-64 w-64 rounded-full bg-violet-600/10 blur-[80px]"></div>
            </div>

            <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <div className="mb-8 flex flex-col items-start justify-between gap-4 border-b border-indigo-100 pb-6 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="pb-1 font-nacelle text-3xl font-semibold text-slate-900 md:text-4xl">
                            Profile Control Center
                        </h1>
                        <p className="mt-2 text-slate-600">Manage your identity, security, and data.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xl font-bold text-white shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-100">
                            {profile?.email?.[0].toUpperCase() || "U"}
                        </div>
                        <div className="hidden text-right sm:block">
                            <div className="text-sm font-medium text-slate-900">{profile?.name || "User"}</div>
                            <div className="text-xs text-slate-500">{profile?.email}</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
                    {/* Sidebar Navigation */}
                    <div className="space-y-2 lg:col-span-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${activeTab === tab.id
                                    ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/25 ring-1 ring-indigo-200"
                                    : "text-slate-600 hover:bg-indigo-50 hover:text-slate-900"
                                    }`}
                            >
                                <span>{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}

                        <div className="my-4 border-t border-indigo-100 pt-4">
                            <button
                                onClick={handleLogout}
                                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition-all hover:bg-red-50 hover:text-red-700"
                            >
                                <span>🚪</span>
                                Logout
                            </button>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm lg:col-span-3">

                        {/* Identity Tab */}
                        {activeTab === "identity" && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-slate-900">Identity Information</h2>
                                <div className="p-0 sm:p-2">
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium uppercase text-slate-500">Email Address</label>
                                            <div className="rounded-lg border border-indigo-100 bg-slate-50/80 p-3 text-slate-800">
                                                {profile?.email}
                                                <span className="ml-2 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">Verified</span>
                                            </div>
                                            <p className="text-xs text-slate-500">Your email is your primary identity.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium uppercase text-slate-500">Full Name</label>
                                            <div className="rounded-lg border border-indigo-100 bg-slate-50/80 p-3 text-slate-800">
                                                {profile?.name || "Not set"}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium uppercase text-slate-500">Account Created</label>
                                            <div className="rounded-lg border border-indigo-100 bg-slate-50/80 p-3 text-slate-800">
                                                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "Unknown"}
                                            </div>
                                        </div>
                                    </div>
                                    {stats && (
                                        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                            {[
                                                { label: "Chats", value: stats.total_chats ?? 0 },
                                                { label: "Media checks", value: stats.total_predictions ?? 0 },
                                                { label: "Images", value: stats.total_images ?? 0 },
                                                { label: "Videos", value: stats.total_videos ?? 0 },
                                                { label: "Plagiarism runs", value: stats.total_analyses ?? 0 },
                                            ].map((row) => (
                                                <div
                                                    key={row.label}
                                                    className="rounded-xl border border-indigo-100 bg-slate-50/80 px-4 py-3 text-center"
                                                >
                                                    <div className="text-2xl font-bold text-slate-900">{row.value}</div>
                                                    <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{row.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === "security" && (
                            <div className="space-y-8">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900">Security Settings</h2>
                                    <p className="text-sm text-slate-600">Manage your password and session security.</p>
                                </div>

                                <div className="p-0 sm:p-2">
                                    <div className="space-y-3">
                                        <h3 className="font-medium text-slate-900">Change Password</h3>
                                        {pwdMsg && (
                                            <div className={`rounded-lg border px-3 py-2 text-sm ${pwdMsg.includes("success") ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>
                                                {pwdMsg}
                                            </div>
                                        )}
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div>
                                                <label className="text-xs font-medium uppercase text-slate-500">Current Password</label>
                                                <input
                                                    type="password"
                                                    className="mt-1 w-full rounded-lg border border-indigo-100 bg-white px-3 py-2 text-slate-900 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                                                    value={pwdCurrent}
                                                    onChange={(e) => setPwdCurrent(e.target.value)}
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium uppercase text-slate-500">New Password</label>
                                                <input
                                                    type="password"
                                                    className="mt-1 w-full rounded-lg border border-indigo-100 bg-white px-3 py-2 text-slate-900 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                                                    value={pwdNew}
                                                    onChange={(e) => setPwdNew(e.target.value)}
                                                    placeholder="At least 8 characters"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <button
                                                onClick={async () => {
                                                    setPwdMsg(null);
                                                    const token = window.localStorage.getItem("realeye_token");
                                                    if (!token) {
                                                        router.push("/signin");
                                                        return;
                                                    }
                                                    try {
                                                        const res = await fetch(`${API_BASE}/api/auth/change-password`, {
                                                            method: "POST",
                                                            headers: {
                                                                "Content-Type": "application/json",
                                                                Authorization: `Bearer ${token}`,
                                                            },
                                                            body: JSON.stringify({ old_password: pwdCurrent, new_password: pwdNew }),
                                                        });
                                                        const data = await res.json().catch(() => ({}));
                                                        if (!res.ok) {
                                                            setPwdMsg(data?.detail || data?.message || "Failed to change password");
                                                            return;
                                                        }
                                                        setPwdMsg("Password updated successfully");
                                                        setPwdCurrent("");
                                                        setPwdNew("");
                                                    } catch (err: any) {
                                                        setPwdMsg(err.message || "Failed to change password");
                                                    }
                                                }}
                                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                                            >
                                                Update Password
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-indigo-100 bg-slate-50/50 p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium text-slate-900">Active Sessions</h3>
                                            <p className="text-xs text-slate-600">You are currently logged in on this device.</p>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-indigo-50"
                                        >
                                            Log out all sessions
                                        </button>
                                    </div>
                                </div>

                                <div className="border-t border-red-100 pt-6">
                                    <h3 className="text-sm font-bold uppercase text-red-600">Danger Zone</h3>
                                    <div className="mt-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50/50 p-4">
                                        <div>
                                            <h4 className="font-medium text-red-700">Delete Account</h4>
                                            <p className="text-xs text-slate-600">Permanently remove your data and access.</p>
                                        </div>
                                        <button type="button" className="rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200">
                                            Delete Account
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Activity Tab removed to prevent network errors when stats are unavailable */}

                        {/* Data Tab */}
                        {activeTab === "data" && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-slate-900">Data Management</h2>
                                <p className="text-slate-600">Access and control your personal data.</p>

                                <div className="space-y-3">
                                    <Link href="/chat" className="group flex items-center justify-between rounded-xl border border-indigo-100 bg-slate-50/30 p-4 transition-all hover:border-indigo-200 hover:bg-indigo-50/50">
                                        <div>
                                            <h3 className="font-medium text-slate-900 group-hover:text-indigo-700 transition-colors">Chat History</h3>
                                            <p className="text-xs text-slate-600">View and export your conversation logs.</p>
                                        </div>
                                        <span className="text-2xl transition-transform group-hover:scale-110">💬</span>
                                    </Link>

                                    <Link href="/tools" className="group flex items-center justify-between rounded-xl border border-indigo-100 bg-slate-50/30 p-4 transition-all hover:border-indigo-200 hover:bg-indigo-50/50">
                                        <div>
                                            <h3 className="font-medium text-slate-900 group-hover:text-indigo-700 transition-colors">Tools — image, video &amp; Project Intel</h3>
                                            <p className="text-xs text-slate-600">Review past detection results and analyses tied to your account.</p>
                                        </div>
                                        <span className="text-2xl transition-transform group-hover:scale-110">📹</span>
                                    </Link>

                                    <Link href="/plagiarism" className="group flex items-center justify-between rounded-xl border border-indigo-100 bg-slate-50/30 p-4 transition-all hover:border-indigo-200 hover:bg-indigo-50/50">
                                        <div>
                                            <h3 className="font-medium text-slate-900 group-hover:text-indigo-700 transition-colors">Project Intel (standalone)</h3>
                                            <p className="text-xs text-slate-600">Open the dedicated page — same engine as Tools → Project Intel.</p>
                                        </div>
                                        <span className="text-2xl transition-transform group-hover:scale-110">📄</span>
                                    </Link>

                                    <div className="group flex items-center justify-between rounded-xl border border-indigo-100 bg-slate-50/30 p-4 transition-all hover:bg-indigo-50/30">
                                        <div>
                                            <h3 className="font-medium text-slate-900">Download All Data</h3>
                                            <p className="text-xs text-slate-600">Get a copy of everything we know about you.</p>
                                        </div>
                                        <button type="button" className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700">
                                            Request Archive
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Preferences Tab */}
                        {activeTab === "preferences" && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-slate-900">Preferences</h2>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium text-slate-900">Email Notifications</h3>
                                            <p className="text-xs text-slate-600">Receive updates about your analysis results.</p>
                                        </div>
                                        <div className="relative h-6 w-11 cursor-pointer rounded-full bg-indigo-600">
                                            <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm" />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium text-slate-900">Theme</h3>
                                            <p className="text-xs text-slate-600">Light theme is the default for readability.</p>
                                        </div>
                                        <div className="rounded-lg border border-indigo-100 bg-slate-100 px-3 py-1 text-xs text-slate-600">Light</div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </section>
    );
}
