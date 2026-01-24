"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";


interface UserProfile {
    email: string;
    name?: string;
    created_at?: string;
    last_login?: string;
}

interface UserStats {
    total_chats: number;
    total_videos: number;
    last_prediction?: any;
    last_chat_session?: any;
}

export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
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
                // Fetch User Info
                // Note: You'll need to implement this endpoint in backend
                const userRes = await fetch("http://localhost:4000/api/auth/me", {
                    headers: { Authorization: Bearer ${token} }
                });

                if (userRes.ok) {
                    const userData = await userRes.json();
                    setProfile(userData);
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
                <div className="mb-8 flex flex-col items-start justify-between gap-4 border-b border-gray-800 pb-6 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-1 font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
                            Profile Control Center
                        </h1>
                        <p className="mt-2 text-indigo-200/65">Manage your identity, security, and data.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white ring-2 ring-white/20 shadow-lg shadow-indigo-500/30">
                            {profile?.email?.[0].toUpperCase()  "U"}
                        </div>
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-medium text-white">{profile?.name  "User"}</div>
                            <div className="text-xs text-gray-500">{profile?.email}</div>
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
                                    ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] ring-1 ring-white/20"
                                    : "text-gray-400 hover:bg-white/5 hover:text-indigo-200"
                                    }`}
                            >
                                <span>{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}

                        <div className="my-4 border-t border-gray-800 pt-4">
                            <button
                                onClick={handleLogout}
                                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 transition-all hover:bg-red-500/10 hover:text-red-300 hover:shadow-lg hover:shadow-red-500/10"
                            >
                                <span>🚪</span>
                                Logout
                            </button>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="p-6 lg:col-span-3">
                      {/* Identity Tab */}
                        {activeTab === "identity" && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-white">Identity Information</h2>
                                <div className="p-6">
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium uppercase text-gray-500">Email Address</label>
                                            <div className="rounded-lg border border-white/10 p-3 text-gray-300">
                                                {profile?.email}
                                                <span className="ml-2 inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400 ring-1 ring-green-500/20">Verified</span>
                                            </div>
                                            <p className="text-xs text-indigo-200/50">Your email is your primary identity.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium uppercase text-gray-500">Full Name</label>
                                            <div className="rounded-lg border border-white/10 p-3 text-gray-300">
                                                {profile?.name  "Not set"}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium uppercase text-gray-500">Account Created</label>
                                            <div className="rounded-lg border border-white/10 p-3 text-gray-300">
                                                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "Unknown"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === "security" && (
                            <div className="space-y-8">
                                <div>
                                    <h2 className="text-xl font-semibold text-white">Security Settings</h2>
                                    <p className="text-sm text-gray-400">Manage your password and session security.</p>
                                </div>

                                <div className="p-6">
                                    <div className="space-y-3">
                                        <h3 className="font-medium text-white">Change Password</h3>
                                        {pwdMsg && (
                                            <div className={`rounded-lg border px-3 py-2 text-sm ${pwdMsg.includes("success") ? "border-green-500/20 bg-green-500/10 text-green-400" : "border-red-500/20 bg-red-500/10 text-red-400"}`}>
                                                {pwdMsg}
                                            </div>
                                        )}
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div>
                                                <label className="text-xs font-medium uppercase text-gray-500">Current Password</label>
                                                <input
                                                    type="password"
                                                    className="mt-1 w-full rounded-lg border border-white/10 px-3 py-2 text-gray-200 outline-none transition-all focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10"
                                                  value={pwdCurrent}
                                                    onChange={(e) => setPwdCurrent(e.target.value)}
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-medium uppercase text-gray-500">New Password</label>
                                                <input
                                                    type="password"
                                                    className="mt-1 w-full rounded-lg border border-white/10 px-3 py-2 text-gray-200 outline-none transition-all focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10"
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
                                                        const res = await fetch("http://localhost:4000/api/auth/change-password", {
                                                            method: "POST",
                                                            headers: {
                                                                "Content-Type": "application/json",
                                                                Authorization: `Bearer ${token}`,
                                                            },
                                                            body: JSON.stringify({ old_password: pwdCurrent, new_password: pwdNew }),
                                                        });
                                                        const data = await res.json().catch(() => ({}));
                                                        if (!res.ok) {
                                                            setPwdMsg(data?.detail  data?.message  "Failed to change password");
                                                            return;
                                                        }
                                                        setPwdMsg("Password updated successfully");
                                                        setPwdCurrent("");
                                                        setPwdNew("");
                                                    } catch (err: any) {
                                                        setPwdMsg(err.message  "Failed to change password");
                                                    }
                                                }}
                                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                                            >
                                                Update Password
                                            </button>
                                        </div>
                                    </div>
                                </div>
                          <div className="rounded-xl border border-white/10 p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium text-white">Active Sessions</h3>
                                            <p className="text-xs text-gray-400">You are currently logged in on this device.</p>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="rounded-lg border border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-white/5 transition-colors"
                                        >
                                            Log out all sessions
                                        </button>
                                    </div>
                                </div>

                                <div className="border-t border-red-500/20 pt-6">
                                    <h3 className="text-sm font-bold uppercase text-red-500">Danger Zone</h3>
                                    <div className="mt-4 flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                                        <div>
                                            <h4 className="font-medium text-red-400">Delete Account</h4>
                                            <p className="text-xs text-gray-500">Permanently remove your data and access.</p>
                                        </div>
                                        <button className="rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500 hover:text-white">
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
                                <h2 className="text-xl font-semibold text-white">Data Management</h2>
                                <p className="text-gray-400">Access and control your personal data.</p>

                                <div className="space-y-3">
                                    <Link href="/chat" className="group flex items-center justify-between rounded-xl border border-white/10 p-4 transition-all hover:bg-white/5">
                                        <div>
                                            <h3 className="font-medium text-white group-hover:text-indigo-300 transition-colors">Chat History</h3>
                                            <p className="text-xs text-gray-400">View and export your conversation logs.</p>
                                        </div>
                                        <span className="text-2xl transition-transform group-hover:scale-110">💬</span>
                                    </Link>

                                    <Link href="/upload" className="group flex items-center justify-between rounded-xl border border-white/10 p-4 transition-all hover:bg-white/5">
                                        <div>
                                            <h3 className="font-medium text-white group-hover:text-purple-300 transition-colors">Video Analysis Data</h3>
                                            <p className="text-xs text-gray-400">Review your past deepfake detection reports.</p>
                                        </div>
                                        <span className="text-2xl transition-transform group-hover:scale-110">📹</span>
                                    </Link>
                                  <div className="group flex items-center justify-between rounded-xl border border-white/10 p-4 transition-all hover:bg-white/5">
                                        <div>
                                            <h3 className="font-medium text-white">Download All Data</h3>
                                            <p className="text-xs text-gray-400">Get a copy of everything we know about you.</p>
                                        </div>
                                        <button className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors">
                                            Request Archive
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Preferences Tab */}
                        {activeTab === "preferences" && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold text-white">Preferences</h2>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium text-gray-200">Email Notifications</h3>
                                            <p className="text-xs text-gray-500">Receive updates about your analysis results.</p>
                                        </div>
                                        <div className="h-6 w-11 rounded-full bg-indigo-600 relative cursor-pointer">
                                            <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm" />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium text-gray-200">Theme</h3>
                                            <p className="text-xs text-gray-500">Currently stuck on Dark Mode (it's cooler).</p>
                                        </div>
                                        <div className="rounded-lg bg-gray-800 px-3 py-1 text-xs text-gray-400">Dark Only</div>
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