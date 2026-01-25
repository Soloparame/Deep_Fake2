"use client";

import { useEffect, useState, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";

interface ChatMessage {
  id: string;
  userId: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
}

interface ChatSession {
  session_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Load suggested questions
  useEffect(() => {
    fetch("http://localhost:4000/api/chat/questions")
      .then(res => {
        if (res.ok) return res.json();
        return [];
      })
      .then(data => setSuggestedQuestions(data))
      .catch(err => console.error("Failed to load suggested questions:", err));
  }, []);

  // Load sessions on mount
  useEffect(() => {
    const token = window.localStorage.getItem("realeye_token");
    if (!token) {
      router.push("/signin");
      return;
    }

    const loadSessions = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/chat/sessions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSessions(data);
          // If we have sessions, select the most recent one (first one if sorted by backend)
          if (data.length > 0) {
            // Sort by updated_at just in case
            const sorted = data.sort((a: ChatSession, b: ChatSession) => 
                new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            );
            setSessions(sorted);
            loadSession(sorted[0].session_id);
          }
        }
      } catch (err) {
        console.error("Failed to load sessions:", err);
      }
    };
    loadSessions();
  }, [router]);

  const loadSession = async (sessionId: string) => {
    const token = window.localStorage.getItem("realeye_token");
    if (!token) return;

    setCurrentSessionId(sessionId);
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/api/chat/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Failed to load session history:", err);
    } finally {
        setLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
  };

  // Auto-scroll to bottom when messages change, but only if user is near bottom
  useEffect(() => {
    if (messagesEndRef.current && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      // Only auto-scroll if user is already near the bottom (within 100px)
      if (isNearBottom || messages.length <= 2) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [messages]);

  const handleSubmit = async (e: FormEvent, overrideMessage?: string) => {
    e.preventDefault();
    setError(null);
    const messageToSend = overrideMessage || input;
    const trimmed = messageToSend.trim();
    if (!trimmed) return;

    const token = window.localStorage.getItem("realeye_token");
    if (!token) {
      router.push("/signin");
      return;
    }

    setLoading(true);
    // Add user message optimistically
    const tempId = Date.now().toString();
    setMessages((prev) => [
        ...prev, 
        { 
            id: tempId, 
            userId: "me", 
            role: "user", 
            text: trimmed, 
            createdAt: new Date().toISOString() 
        }
    ]);
    setInput("");

    try {
      const res = await fetch("http://localhost:4000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
            message: trimmed,
            session_id: currentSessionId 
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Server returned ${res.status}`);
      }
      const data = await res.json();
      
      // Update session ID if this was a new session
      if (data.session_id && !currentSessionId) {
          setCurrentSessionId(data.session_id);
          // Refresh sessions list to show the new one in sidebar
          fetch("http://localhost:4000/api/chat/sessions", {
             headers: { Authorization: `Bearer ${token}` }
          })
          .then(r => r.json())
          .then(data => {
             const sorted = data.sort((a: ChatSession, b: ChatSession) => 
                 new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
             );
             setSessions(sorted);
          });
      }

      if (data.message) {
        // Replace the optimistic message or just append the response?
        // Let's append the response. The optimistic message is already there.
        // But we might want to replace the optimistic one with the real one from DB if we want IDs to match.
        // For simplicity, let's just append the bot response.
        setMessages((prev) => {
            // Remove the temp user message if we want to rely on backend return?
            // Actually, the backend returns the *response*, not the full history usually.
            // Let's check schemas/chat.py. ChatResponse has `message: ChatMessage` (the bot response).
            // It doesn't return the user message with ID.
            // So we keep our optimistic user message.
            return [...prev, data.message];
        });
      }
      setError(null); 
    } catch (err: any) {
      console.error("Failed to send message:", err);
      // Remove optimistic message on error? Or show error state?
      setMessages(prev => prev.filter(m => m.id !== tempId));
      
      if (err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")) {
        setError("Backend server is not running. Please start it with 'npm run server' in a separate terminal.");
      } else {
        setError(err.message || "Failed to send message. Please check if the backend server is running.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative flex h-[calc(100vh-80px)] pt-4">
      {/* Background glow for chat */}
      <div className="absolute right-0 top-10 -z-10 h-96 w-96 rounded-full bg-indigo-500/10 blur-[120px]"></div>

      {/* Sidebar like ChatGPT */}
      <aside className="hidden w-72 flex-shrink-0 flex-col border-r border-white/5 bg-gray-900/40 backdrop-blur-md p-4 md:flex h-full overflow-hidden">
        <button
          type="button"
          onClick={handleNewChat}
          className="group mb-6 flex w-full items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-left text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>

        <div className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Recent History
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
          {sessions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-white/5 p-4 text-center">
              <p className="text-xs text-gray-500">No recent conversations.</p>
            </div>
          ) : (
            sessions.map((session) => (
                <div 
                    key={session.session_id}
                    onClick={() => loadSession(session.session_id)}
                    className={`group flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors hover:bg-white/10 ${
                        currentSessionId === session.session_id ? "bg-white/10" : "bg-white/5"
                    }`}
                >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-gray-300">{session.title || "New Chat"}</p>
                        <p className="text-[10px] text-gray-500">
                            {new Date(session.updated_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            ))
          )}
        </div>

        <div className="mt-4 border-t border-white/5 pt-4">
          <div className="flex items-center gap-3 rounded-xl bg-gray-950/50 p-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500"></div>
            <div className="text-xs">
              <p className="font-medium text-white">Pro Plan</p>
              <p className="text-gray-500">Active</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main chat area */}
      <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 sm:px-6 overflow-hidden">
        <div className="py-6 flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h1 className="font-nacelle text-2xl font-semibold text-white">
                Deepfake Detective AI
              </h1>
              <p className="text-sm text-gray-400">Powered by advanced computer vision models</p>
            </div>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-white/5 bg-gray-900/40 backdrop-blur-sm shadow-2xl">
            {/* Error Banner */}
            {error && (
              <div className="border-b border-red-500/20 bg-red-500/10 px-6 py-3 text-sm text-red-400">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}
            {/* Messages Area - Scrollable */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-6 scroll-smooth"
              style={{ minHeight: 0, maxHeight: '100%' }}
            >
              <div className="space-y-6">
                {messages.length === 0 && (
                  <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center opacity-100">
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-500/10 text-indigo-400">
                      <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-medium text-white">How can I help you detect deepfakes?</h3>
                    <p className="mt-2 mb-8 max-w-md text-sm text-gray-400">
                      Ask about artifacts, upload guidance, or technical details about the detection architecture.
                    </p>
                    
                    <div className="grid w-full max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
                        {suggestedQuestions.map((q, i) => (
                            <button
                                key={i}
                                onClick={(e) => handleSubmit(e as unknown as FormEvent, q)}
                                className="rounded-xl border border-white/10 bg-white/5 p-3 text-left text-sm text-gray-300 transition-colors hover:border-indigo-500/50 hover:bg-white/10"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                  </div>
                )}
                {messages.map((m, index) => (
                  <div
                    key={m.id}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"
                      }`}
                  >
                    <div className={`flex max-w-[80%] gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${m.role === "user" ? "bg-indigo-600" : "bg-gray-700"}`}>
                        {m.role === "user" ? (
                          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        )}
                      </div>

                      <div
                        className={`rounded-2xl px-5 py-3 text-sm shadow-md transition-all hover:shadow-lg ${m.role === "user"
                            ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-br-none"
                            : "bg-gray-800 text-gray-100 rounded-bl-none border border-white/5"
                          }`}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap break-words">{m.text}</p>
                        <p className={`mt-1 text-[10px] ${m.role === "user" ? "text-indigo-200" : "text-gray-500"}`}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Show suggested questions after assistant's last message */}
                {messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && !loading && (
                  <div className="mt-6 flex flex-col items-center">
                    <p className="mb-4 text-sm text-gray-400">Suggested questions:</p>
                    <div className="grid w-full max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
                      {suggestedQuestions.map((q, i) => (
                        <button
                          key={i}
                          onClick={(e) => handleSubmit(e as unknown as FormEvent, q)}
                          className="rounded-xl border border-white/10 bg-white/5 p-3 text-left text-sm text-gray-300 transition-colors hover:border-indigo-500/50 hover:bg-white/10"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area - Fixed at bottom */}
            <div className="flex-shrink-0 border-t border-white/5 bg-gray-900/60 p-4 backdrop-blur-lg">
              <form onSubmit={handleSubmit} className="relative flex items-end gap-2 text-sm">
                <div className="relative flex-1">
                  <textarea
                    className="form-input min-h-[50px] max-h-[200px] w-full resize-none rounded-xl border border-white/10 bg-gray-950/50 py-3 pr-12 pl-4 text-gray-200 placeholder:text-gray-600 focus:border-indigo-500/50 focus:bg-gray-950/80 focus:ring-0"
                    placeholder="Ask about your video analysis..."
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      // Auto-resize textarea
                      e.target.style.height = 'auto';
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    rows={1}
                  />
                </div>
                <button
                  type="submit"
                  className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600"
                  disabled={loading || !input.trim()}
                >
                  {loading ? (
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </form>
              <div className="mt-2 text-center text-[10px] text-gray-600">
                RealEye AI can make mistakes. Verify important information.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
