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
        // Fetch User Info
        // Note: You'll need to implement this endpoint in backend
        const userRes = await fetch("http://localhost:4000/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (userRes.ok) {
            const userData = await userRes.json();
            setProfile(userData);
        }

        // Fetch Stats
        // Note: You'll need to implement this endpoint in backend
        const statsRes = await fetch("http://localhost:4000/api/user/stats", {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (statsRes.ok) {
            const statsData = await statsRes.json();
            setStats(statsData);
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
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-indigo-500">Loading profile...</div>
      </div>
    );
  }

  const tabs = [
    { id: "identity", label: "Identity", icon: "👤" },
    { id: "security", label: "Security", icon: "🔒" },
    { id: "activity", label: "Activity", icon: "📊" },
    { id: "data", label: "Data", icon: "💾" },
    { id: "preferences", label: "Preferences", icon: "⚙️" },
  ];

  return (
    <section className="relative min-h-screen overflow-hidden bg-gray-900 pt-24 pb-12">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 -z-10 h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[120px]" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-8 flex flex-col items-start justify-between gap-4 border-b border-gray-800 pb-6 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Profile Control Center</h1>
                    <p className="mt-1 text-gray-400">Manage your identity, security, and data.</p>
                </div>
                <div className="flex items-center gap-3">
                     <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white">
                        {profile?.email?.[0].toUpperCase() || "U"}
                     </div>
                     <div className="text-right hidden sm:block">
                        <div className="text-sm font-medium text-white">{profile?.name || "User"}</div>
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
                            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                                activeTab === tab.id
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                            }`}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                    
                    <div className="my-4 border-t border-gray-800 pt-4">
                        <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                        >
                            <span>🚪</span>
                            Logout
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-sm lg:col-span-3">
                    
                    {/* Identity Tab */}
                    {activeTab === "identity" && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-white">Identity Information</h2>
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium uppercase text-gray-500">Email Address</label>
                                    <div className="rounded-lg border border-gray-700 bg-gray-800 p-3 text-gray-300">
                                        {profile?.email}
                                        <span className="ml-2 inline-flex items-center rounded bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">Verified</span>
                                    </div>
                                    <p className="text-xs text-gray-500">Your email is your primary identity.</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium uppercase text-gray-500">Full Name</label>
                                    <div className="rounded-lg border border-gray-700 bg-gray-800 p-3 text-gray-300">
                                        {profile?.name || "Not set"}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium uppercase text-gray-500">Account Created</label>
                                    <div className="rounded-lg border border-gray-700 bg-gray-800 p-3 text-gray-300">
                                        {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "Unknown"}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium uppercase text-gray-500">User ID</label>
                                    <div className="rounded-lg border border-gray-700 bg-gray-800 p-3 font-mono text-xs text-gray-400">
                                        {profile?.id || "unknown"}
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

                            <div className="space-y-4 rounded-xl border border-gray-700 bg-gray-800/30 p-4">
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
                                          className="mt-1 w-full rounded-lg border border-white/10 bg-gray-900/60 px-3 py-2 text-gray-200 outline-none transition-all focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10"
                                          value={pwdCurrent}
                                          onChange={(e) => setPwdCurrent(e.target.value)}
                                          placeholder="••••••••"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs font-medium uppercase text-gray-500">New Password</label>
                                        <input
                                          type="password"
                                          className="mt-1 w-full rounded-lg border border-white/10 bg-gray-900/60 px-3 py-2 text-gray-200 outline-none transition-all focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10"
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
                                        className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600"
                                      >
                                        Update Password
                                      </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 rounded-xl border border-gray-700 bg-gray-800/30 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-medium text-white">Active Sessions</h3>
                                        <p className="text-xs text-gray-400">You are currently logged in on this device.</p>
                                    </div>
                                    <button 
                                        onClick={handleLogout}
                                        className="rounded-lg border border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-300 hover:bg-gray-700"
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

                    {/* Activity Tab */}
                    {activeTab === "activity" && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-white">Your Activity</h2>
                            
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
                                    <div className="text-2xl font-bold text-indigo-400">{stats?.total_chats || 0}</div>
                                    <div className="text-xs text-gray-400">Total Conversations</div>
                                </div>
                                <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
                                    <div className="text-2xl font-bold text-purple-400">{stats?.total_videos || 0}</div>
                                    <div className="text-xs text-gray-400">Videos Uploaded</div>
                                </div>
                                <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
                                    <div className="text-2xl font-bold text-green-400">Active</div>
                                    <div className="text-xs text-gray-400">Account Status</div>
                                </div>
                            </div>

                            <div className="mt-8">
                                <h3 className="mb-4 text-sm font-medium uppercase text-gray-500">Recent History</h3>
                                <div className="space-y-3">
                                    {/* Placeholder for recent activity items */}
                                    <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-800/20 p-3">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded bg-indigo-500/20 p-2 text-indigo-400">💬</div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-200">Chat Session</div>
                                                <div className="text-xs text-gray-500">Started 2 hours ago</div>
                                            </div>
                                        </div>
                                        <Link href="/chat" className="text-xs text-indigo-400 hover:text-indigo-300">View</Link>
                                    </div>
                                    
                                    <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-800/20 p-3">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded bg-purple-500/20 p-2 text-purple-400">📹</div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-200">Deepfake Analysis</div>
                                                <div className="text-xs text-gray-500">Uploaded yesterday</div>
                                            </div>
                                        </div>
                                        <Link href="/upload" className="text-xs text-indigo-400 hover:text-indigo-300">View</Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                     {/* Data Tab */}
                     {activeTab === "data" && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-white">Data Management</h2>
                            <p className="text-gray-400">Access and control your personal data.</p>
                            
                            <div className="space-y-3">
                                <Link href="/chat" className="flex items-center justify-between rounded-xl border border-gray-700 bg-gray-800/30 p-4 transition-colors hover:border-indigo-500/50">
                                    <div>
                                        <h3 className="font-medium text-white">Chat History</h3>
                                        <p className="text-xs text-gray-400">View and export your conversation logs.</p>
                                    </div>
                                    <span className="text-2xl">💬</span>
                                </Link>

                                <Link href="/upload" className="flex items-center justify-between rounded-xl border border-gray-700 bg-gray-800/30 p-4 transition-colors hover:border-purple-500/50">
                                    <div>
                                        <h3 className="font-medium text-white">Video Analysis Data</h3>
                                        <p className="text-xs text-gray-400">Review your past deepfake detection reports.</p>
                                    </div>
                                    <span className="text-2xl">📹</span>
                                </Link>

                                <div className="flex items-center justify-between rounded-xl border border-gray-700 bg-gray-800/30 p-4">
                                    <div>
                                        <h3 className="font-medium text-white">Download All Data</h3>
                                        <p className="text-xs text-gray-400">Get a copy of everything we know about you.</p>
                                    </div>
                                    <button className="rounded-lg bg-gray-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-600">
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
