/** Backend base URL. Local dev default; set NEXT_PUBLIC_API_URL on Vercel for production. */
export const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000"
);

/** Build a full API URL from a path (e.g. `/api/auth/login`). */
export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
}
