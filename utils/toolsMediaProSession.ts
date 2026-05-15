/**
 * Demo "pro" gate for Tools media detectors (frontend only).
 * - Survives logout (localStorage, keyed by signed-in user id from JWT).
 * - One successful upgrade unlocks both detectors until the user has visited
 *   both the video and image detector tabs; then the paywall returns on the next click.
 */

const STORAGE_PREFIX = "realeye_tools_media_cycle:";
/** Legacy sessionStorage flag from earlier version — removed on load. */
const LEGACY_PREFIX = "realeye_tools_media_pro:";

export type ToolsMediaCycleState = {
  paid: boolean;
  visitedVideo: boolean;
  visitedImage: boolean;
};

const emptyState = (): ToolsMediaCycleState => ({
  paid: false,
  visitedVideo: false,
  visitedImage: false,
});

function userKeyFromToken(): string {
  if (typeof window === "undefined") return "unknown";
  const token = window.localStorage.getItem("realeye_token");
  if (!token) return "signed-out";
  try {
    const payload = token.split(".")[1];
    if (!payload) return "user";
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const pad = normalized.length % 4 ? "=".repeat(4 - (normalized.length % 4)) : "";
    const decoded = atob(normalized + pad);
    const parsed = JSON.parse(decoded) as { email?: string; sub?: string };
    return parsed.email ?? parsed.sub ?? "user";
  } catch {
    return "user";
  }
}

function storageKey(): string {
  return STORAGE_PREFIX + userKeyFromToken();
}

function clearLegacySessionKeys(): void {
  const toRemove: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const k = sessionStorage.key(i);
    if (k?.startsWith(LEGACY_PREFIX)) toRemove.push(k);
  }
  toRemove.forEach((k) => sessionStorage.removeItem(k));
}

function read(): ToolsMediaCycleState {
  if (typeof window === "undefined") return emptyState();
  clearLegacySessionKeys();
  const id = userKeyFromToken();
  if (id === "signed-out") return emptyState();
  const raw = localStorage.getItem(storageKey());
  if (!raw) return emptyState();
  try {
    const p = JSON.parse(raw) as Partial<ToolsMediaCycleState>;
    return {
      paid: Boolean(p.paid),
      visitedVideo: Boolean(p.visitedVideo),
      visitedImage: Boolean(p.visitedImage),
    };
  } catch {
    return emptyState();
  }
}

function write(s: ToolsMediaCycleState): void {
  if (typeof window === "undefined") return;
  const id = userKeyFromToken();
  if (id === "signed-out") return;
  localStorage.setItem(storageKey(), JSON.stringify(s));
}

/** True → open detector tab directly; false → show upgrade modal. */
export function shouldSkipDetectorPaywall(): boolean {
  const s = read();
  if (!s.paid) return false;
  if (s.visitedVideo && s.visitedImage) return false;
  return true;
}

export function markDetectorPaymentSuccess(landing: "video" | "image"): void {
  write({
    paid: true,
    visitedVideo: landing === "video",
    visitedImage: landing === "image",
  });
}

export function markToolsDetectorTabVisited(tab: "video" | "image"): void {
  const s = read();
  if (!s.paid) return;
  if (tab === "video" && s.visitedVideo) return;
  if (tab === "image" && s.visitedImage) return;
  if (tab === "video") write({ ...s, visitedVideo: true });
  else write({ ...s, visitedImage: true });
}
