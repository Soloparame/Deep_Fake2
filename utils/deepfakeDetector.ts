export interface VideoVerdict {
  status: "Suspicious" | "Likely Real" | "Uncertain";
  averageFakeProbabilityPercent: number;
  samplesUsed: number;
  /** HF model ids configured for this run (from API response). */
  modelsConfigured: number;
}

export interface DetectionResult {
  label: string;
  confidence: number;
  source?: "huggingface" | "keras";
  videoVerdict?: VideoVerdict;
}

type HfModelRow = { http_status?: number | null; api?: unknown };

interface HfVideoApiResponse {
  source?: string;
  models?: string[];
  frame_results?: Array<{
    frame_index: number;
    models?: Record<string, HfModelRow>;
  }>;
}

function isFakeClassLabel(label: string): boolean {
  const l = label.toLowerCase();
  if (/\bfake\b/.test(l) || /\bdeepfake\b/.test(l) || /\bspoof\b/.test(l)) return true;
  if (l === "label_1" || l === "synthesized" || l === "ai") return true;
  if (l === "hum") return false;
  return l.includes("fake") && !/\breal\b/.test(l);
}

function isRealClassLabel(label: string): boolean {
  const l = label.toLowerCase();
  if (/\bfake\b/.test(l) || l === "ai") return false;
  if (l === "hum" || l === "human") return true;
  return (
    l === "label_0" ||
    /\breal\b/.test(l) ||
    /\bauthentic\b/.test(l) ||
    /\bbonafide\b/.test(l) ||
    /\blive\b/.test(l)
  );
}

function readScore(o: Record<string, unknown>): number {
  const s = o.score ?? o.confidence;
  const n = typeof s === "number" ? s : Number(s);
  return Number.isNaN(n) ? NaN : n;
}

function classificationRows(api: unknown): Array<{ label: string; score: number }> {
  if (api && typeof api === "object" && !Array.isArray(api)) {
    const obj = api as Record<string, unknown>;
    if (obj.error != null && obj.error !== false && obj.error !== "") return [];
    if (Array.isArray(obj.predictions)) return classificationRows(obj.predictions);
  }
  if (!Array.isArray(api)) return [];
  const out: Array<{ label: string; score: number }> = [];
  for (const item of api) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const lab = String(o.label ?? o.class ?? "");
    const sc = readScore(o);
    if (Number.isNaN(sc)) continue;
    out.push({ label: lab, score: sc });
  }
  return out;
}

/**
 * Extract P(fake) from one model's HF classification output (handles many label styles).
 */
function fakeScoreFromModelApi(api: unknown): number | null {
  const rows = classificationRows(api);
  if (rows.length === 0) return null;

  let fakeScore: number | null = null;
  let realScore: number | null = null;

  for (const { label: lab, score: sc } of rows) {
    if (isFakeClassLabel(lab)) {
      fakeScore = fakeScore === null ? sc : Math.max(fakeScore, sc);
    }
    if (isRealClassLabel(lab)) {
      realScore = realScore === null ? sc : Math.max(realScore, sc);
    }
  }

  if (fakeScore !== null && realScore !== null && fakeScore + realScore > 1e-6) {
    return Math.min(1, Math.max(0, fakeScore / (fakeScore + realScore)));
  }
  if (fakeScore !== null) return Math.min(1, Math.max(0, fakeScore));
  if (realScore !== null) return Math.min(1, Math.max(0, 1 - realScore));

  // Single top prediction only
  if (rows.length === 1) {
    const r = rows[0];
    const lab = r.label.toLowerCase().trim();
    if (isFakeClassLabel(r.label)) return Math.min(1, Math.max(0, r.score));
    if (isRealClassLabel(r.label)) return Math.min(1, Math.max(0, 1 - r.score));
    if (lab === "1" || lab === "fake") return Math.min(1, Math.max(0, r.score));
    if (lab === "0") return Math.min(1, Math.max(0, 1 - r.score));
    return null;
  }

  // Binary classifier with odd labels (e.g. class names) — use softmax from top two scores
  if (rows.length === 2) {
    const [a, b] = rows;
    const sum = a.score + b.score;
    if (sum > 1e-6) {
      const hi = a.score >= b.score ? a : b;
      const lo = a.score >= b.score ? b : a;
      if (isFakeClassLabel(hi.label)) return Math.min(1, Math.max(0, hi.score / sum));
      if (isRealClassLabel(hi.label)) return Math.min(1, Math.max(0, lo.score / sum));
      // Unknown labels: treat higher logit as predicted class; map second slot as fake if sorted by label
      const sorted = [...rows].sort((x, y) => x.label.localeCompare(y.label));
      return Math.min(1, Math.max(0, sorted[1].score / sum));
    }
  }

  return null;
}

/**
 * Pool fake scores across every (frame × model) HTTP 200 response, then apply the same
 * >50% rule as the reference script (professional summary — frontend only).
 */
export function summarizeHfMultiModelVideo(res: HfVideoApiResponse): VideoVerdict {
  const modelOrder = res.models ?? [];
  const frames = res.frame_results ?? [];
  const scores: number[] = [];

  for (const fr of frames) {
    const per = fr.models;
    if (!per) continue;
    for (const mid of modelOrder) {
      const row = per[mid];
      if (!row) continue;
      // 200 = OK; omit or null status still try parse (some proxies strip status)
      if (row.http_status != null && row.http_status !== 200) continue;
      const s = fakeScoreFromModelApi(row.api);
      if (s !== null) scores.push(s);
    }
  }

  if (scores.length === 0) {
    return {
      status: "Uncertain",
      averageFakeProbabilityPercent: 0,
      samplesUsed: 0,
      modelsConfigured: modelOrder.length,
    };
  }

  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const averageFakeProbabilityPercent = Math.round(mean * 10000) / 100;
  return {
    status: mean > 0.5 ? "Suspicious" : "Likely Real",
    averageFakeProbabilityPercent,
    samplesUsed: scores.length,
    modelsConfigured: modelOrder.length,
  };
}

class DeepfakeDetector {
  private _isModelLoaded = false;
  private readonly BACKEND_URL = "http://localhost:8000/api";

  isModelLoaded(): boolean {
    return this._isModelLoaded;
  }

  async loadModel(): Promise<void> {
    console.log("Connecting to detection backend...");
    this._isModelLoaded = true;
    return Promise.resolve();
  }

  analyzeVideo(file: File, onProgress: (message: string) => void): Promise<DetectionResult> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${this.BACKEND_URL}/detect-video`, true);

      const token = window.localStorage.getItem("realeye_token");
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          if (percentComplete < 100) {
            onProgress(`Uploading video... ${percentComplete}%`);
          } else {
            onProgress("Running multi-model inference…");
          }
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText) as Record<string, unknown>;

            if (response.source === "huggingface") {
              const verdict = summarizeHfMultiModelVideo(response as HfVideoApiResponse);
              const confidence =
                verdict.samplesUsed > 0 ? verdict.averageFakeProbabilityPercent / 100 : 0;
              resolve({
                label: verdict.status === "Suspicious" ? "FAKE" : "REAL",
                confidence,
                source: "huggingface",
                videoVerdict: verdict,
              });
              return;
            }

            const score = typeof response.score === "number" ? response.score : 0;
            resolve({
              label: (response.label as string) ?? "REAL",
              confidence: score,
              source: response.source === "keras" ? "keras" : undefined,
            });
          } catch {
            reject(new Error("Failed to parse server response"));
          }
        } else {
          try {
            const errorResp = JSON.parse(xhr.responseText);
            reject(new Error(errorResp.detail || "Server error during analysis"));
          } catch {
            reject(new Error(`Server returned status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(
          new Error(
            `Network error occurred while connecting to ${this.BACKEND_URL}/detect-video. Please ensure the backend server is running.`
          )
        );
      };

      xhr.send(formData);
    });
  }
}

export const deepfakeDetector = new DeepfakeDetector();
