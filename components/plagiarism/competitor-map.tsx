"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  ScatterController,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  type ActiveElement,
  type Chart,
  type ChartOptions,
  type Plugin,
  type TooltipModel,
} from "chart.js";
import { Scatter } from "react-chartjs-2";
import type { CompetitorMapEntry } from "@/types/analysis";

export type CompetitorAxisKey =
  | "price_score"
  | "local_support_score"
  | "market_share_score"
  | "quality_score";

const X_AXIS_OPTIONS: { value: CompetitorAxisKey; label: string }[] = [
  { value: "price_score", label: "Price (low → high)" },
  { value: "local_support_score", label: "Local support" },
  { value: "market_share_score", label: "Market share" },
];

const Y_AXIS_OPTIONS: { value: CompetitorAxisKey; label: string }[] = [
  { value: "quality_score", label: "Service quality" },
  { value: "local_support_score", label: "Local support" },
  { value: "market_share_score", label: "Market share" },
];

const SCORE_LABELS: Record<CompetitorAxisKey, string> = {
  price_score: "Price (low → high)",
  quality_score: "Service quality",
  local_support_score: "Local support",
  market_share_score: "Market share",
};

const STAT_TILES: { key: CompetitorAxisKey; label: string }[] = [
  { key: "price_score", label: "Price (low → high)" },
  { key: "quality_score", label: "Service quality" },
  { key: "local_support_score", label: "Local support" },
  { key: "market_share_score", label: "Market share" },
];

const competitorDotLabelPlugin: Plugin<"scatter"> = {
  id: "competitorDotLabels",
  afterDatasetsDraw(chart: Chart<"scatter">) {
    const meta = chart.getDatasetMeta(0);
    const plugins = chart.options.plugins as { scatterMeta?: { entries: CompetitorMapEntry[] } } | undefined;
    const entries = plugins?.scatterMeta?.entries;
    if (!meta?.data?.length || !entries?.length) return;
    const { ctx } = chart;
    meta.data.forEach((el, i) => {
      const entry = entries[i];
      if (!entry || !el) return;
      const { x, y } = el.getProps(["x", "y"], true);
      ctx.save();
      ctx.font = entry.is_you
        ? "bold 11px system-ui, -apple-system, Segoe UI, sans-serif"
        : "11px system-ui, -apple-system, Segoe UI, sans-serif";
      ctx.fillStyle = "#0f172a";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      const name = entry.name.length > 26 ? `${entry.name.slice(0, 24)}…` : entry.name;
      const pad = entry.is_you ? 22 : 16;
      ctx.fillText(name, x, y - pad);
      ctx.restore();
    });
  },
};

ChartJS.register(
  ScatterController,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  competitorDotLabelPlugin,
);

function getOrCreateTooltipEl(chart: Chart): HTMLDivElement {
  const parent = chart.canvas.parentNode as HTMLElement | null;
  if (!parent) {
    throw new Error("Chart canvas has no parent");
  }
  let el = parent.querySelector(":scope > .competitor-map-tooltip") as HTMLDivElement | null;
  if (!el) {
    el = document.createElement("div");
    el.className =
      "competitor-map-tooltip pointer-events-none absolute z-20 min-w-[200px] max-w-[280px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left shadow-lg";
    el.style.opacity = "0";
    parent.insertBefore(el, chart.canvas.nextSibling);
  }
  return el;
}

function externalTooltip(
  context: { chart: Chart; tooltip: TooltipModel<"scatter"> | null },
  entries: CompetitorMapEntry[],
  xLabel: string,
  yLabel: string,
) {
  const { chart, tooltip } = context;
  if (!tooltip) return;
  const el = getOrCreateTooltipEl(chart);
  if (tooltip.opacity === 0) {
    el.style.opacity = "0";
    return;
  }
  const dp = tooltip.dataPoints?.[0];
  if (dp == null || typeof dp.dataIndex !== "number") {
    el.style.opacity = "0";
    return;
  }
  const entry = entries[dp.dataIndex];
  if (!entry) {
    el.style.opacity = "0";
    return;
  }
  const xv = typeof dp.parsed.x === "number" ? dp.parsed.x.toFixed(1) : String(dp.parsed.x);
  const yv = typeof dp.parsed.y === "number" ? dp.parsed.y.toFixed(1) : String(dp.parsed.y);
  el.innerHTML = `
    <div class="text-sm font-semibold text-slate-900">${escapeHtml(entry.name)}</div>
    <div class="mt-1.5 space-y-0.5 text-xs text-slate-600">
      <div><span class="text-slate-500">${escapeHtml(xLabel)}:</span> <strong class="text-slate-800">${escapeHtml(xv)}</strong> <span class="text-slate-400">/ 100</span></div>
      <div><span class="text-slate-500">${escapeHtml(yLabel)}:</span> <strong class="text-slate-800">${escapeHtml(yv)}</strong> <span class="text-slate-400">/ 100</span></div>
    </div>
    <p class="mt-2 border-t border-slate-100 pt-2 text-[10px] leading-snug text-slate-500">
      <span class="font-medium text-slate-600">Why is this point here?</span>
      Each axis is a normalized score (0–100) derived from your report text and the entity’s snippet/URL — useful for comparing positioning, not live market facts. Switch axes to ask “what if we weight price vs. quality?”
    </p>
  `;
  const parent = chart.canvas.parentNode as HTMLElement;
  const rect = parent.getBoundingClientRect();
  const canvasRect = chart.canvas.getBoundingClientRect();
  const x = canvasRect.left - rect.left + tooltip.caretX;
  const y = canvasRect.top - rect.top + tooltip.caretY;
  el.style.opacity = "1";
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.transform = "translate(-50%, calc(-100% - 12px))";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatScore(n: number): string {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  return n.toFixed(1);
}

export function CompetitorMap(props: { data: CompetitorMapEntry[]; companyName: string }) {
  const { data, companyName } = props;
  const [xAxis, setXAxis] = useState<CompetitorAxisKey>("price_score");
  const [yAxis, setYAxis] = useState<CompetitorAxisKey>("quality_score");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const xLabel = SCORE_LABELS[xAxis];
  const yLabel = SCORE_LABELS[yAxis];

  const setXAxisSafe = useCallback(
    (v: CompetitorAxisKey) => {
      setXAxis(v);
      if (v === yAxis) {
        const alt = Y_AXIS_OPTIONS.find((o) => o.value !== v);
        if (alt) setYAxis(alt.value);
      }
    },
    [yAxis],
  );

  const setYAxisSafe = useCallback(
    (v: CompetitorAxisKey) => {
      setYAxis(v);
      if (v === xAxis) {
        const alt = X_AXIS_OPTIONS.find((o) => o.value !== v);
        if (alt) setXAxis(alt.value);
      }
    },
    [xAxis],
  );

  const chartData = useMemo(
    () => ({
      datasets: [
        {
          label: "Positioning",
          data: data.map((e) => ({
            x: e[xAxis],
            y: e[yAxis],
          })),
          backgroundColor: data.map((e) => e.color),
          borderColor: data.map(() => "#ffffff"),
          borderWidth: 2,
          pointRadius: (ctx: { dataIndex?: number }) => {
            const i = ctx.dataIndex;
            if (i === undefined || !data[i]) return 12;
            return data[i].is_you ? 16 : 12;
          },
          pointHoverRadius: (ctx: { dataIndex?: number }) => {
            const i = ctx.dataIndex;
            if (i === undefined || !data[i]) return 15;
            return data[i].is_you ? 20 : 15;
          },
          pointStyle: (ctx: { dataIndex?: number }) => {
            const i = ctx.dataIndex;
            if (i === undefined || !data[i]) return "circle";
            return data[i].is_you ? "rectRounded" : "circle";
          },
        },
      ],
    }),
    [data, xAxis, yAxis],
  );

  const chartOptions: ChartOptions<"scatter"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 420, easing: "easeOutQuart" },
      layout: { padding: { top: 8, left: 8, right: 12, bottom: 8 } },
      interaction: { mode: "nearest", intersect: true },
      onClick: (_event, elements: ActiveElement[]) => {
        if (!elements.length) return;
        setSelectedIndex(elements[0].index);
      },
      scales: {
        x: {
          min: 0,
          max: 100,
          title: { display: true, text: xLabel, color: "#475569", font: { size: 12, weight: 600 } },
          ticks: { color: "#64748b", stepSize: 20 },
          grid: { color: "rgba(148, 163, 184, 0.35)" },
        },
        y: {
          min: 0,
          max: 100,
          title: { display: true, text: yLabel, color: "#475569", font: { size: 12, weight: 600 } },
          ticks: { color: "#64748b", stepSize: 20 },
          grid: { color: "rgba(148, 163, 184, 0.35)" },
        },
      },
      plugins: {
        legend: { display: false },
        scatterMeta: { entries: data },
        tooltip: {
          enabled: false,
          external: (ctx) =>
            externalTooltip(ctx as { chart: Chart; tooltip: TooltipModel<"scatter"> | null }, data, xLabel, yLabel),
        },
      } as ChartOptions<"scatter">["plugins"],
    }),
    [data, xLabel, yLabel],
  );

  const selected = selectedIndex != null ? data[selectedIndex] : null;

  const competitorCount = data.filter((e) => !e.is_you).length;

  if (!data.length) {
    return (
      <section className="rounded-2xl border border-indigo-100 bg-white/85 p-6 shadow-sm ring-1 ring-slate-100">
        <h3 className="font-nacelle text-lg font-bold text-slate-900">Competitive positioning map</h3>
        <p className="mt-1 text-sm text-slate-600">
          Click any dot to explore. Switch axes to see different dimensions of competition.
        </p>
        <p className="mt-4 text-sm text-slate-500">
          No competitor map data for this report. Run a new analysis to populate the chart.
        </p>
      </section>
    );
  }

  if (competitorCount === 0) {
    return (
      <section className="rounded-2xl border border-amber-100 bg-white/85 p-6 shadow-sm ring-1 ring-amber-100">
        <h3 className="font-nacelle text-lg font-bold text-slate-900">Competitive positioning map</h3>
        <p className="mt-1 text-sm text-slate-600">
          Each dot is a detected competitor from your market scan (plus your project). None were found for this
          run — add a clearer description, domain, and target market, then analyze again.
        </p>
        <p className="mt-4 text-sm text-amber-800/90">
          Only <span className="font-medium">{companyName || "your project"}</span> is on the map until competitors
          are discovered.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-indigo-100 bg-white/90 p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
      <h3 className="font-nacelle text-lg font-bold text-slate-900">Competitive positioning map</h3>
      <p className="mt-1 text-sm text-slate-600">
        Click any dot to explore. Switch axes to see different dimensions of competition.
      </p>
      <p className="mt-2 text-xs text-slate-500">
        <span className="font-medium text-slate-700">{competitorCount} competitor{competitorCount === 1 ? "" : "s"}</span>{" "}
        from your market scan, plus <span className="font-medium text-slate-700">{companyName || "your project"}</span>.
        Each competitor dot uses scores derived from their name, URL, and snippet (for relative positioning, not live benchmarks).
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs font-semibold text-slate-600">
          X axis
          <select
            value={xAxis}
            onChange={(e) => setXAxisSafe(e.target.value as CompetitorAxisKey)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
          >
            {X_AXIS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs font-semibold text-slate-600">
          Y axis
          <select
            value={yAxis}
            onChange={(e) => setYAxisSafe(e.target.value as CompetitorAxisKey)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
          >
            {Y_AXIS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="relative mt-4 w-full" style={{ height: 340 }}>
        <Scatter data={chartData} options={chartOptions} />
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-4">
        {data.map((e, idx) => (
          <div key={`${idx}-${e.name}-${e.url}`} className="flex items-center gap-2 text-xs text-slate-700">
            <span
              className={e.is_you ? "h-3 w-3 shrink-0 rounded-sm" : "h-2.5 w-2.5 shrink-0 rounded-full"}
              style={{ backgroundColor: e.color }}
              aria-hidden
            />
            <span className={e.is_you ? "font-semibold" : ""}>
              {e.name}
              {e.is_you ? " (you)" : null}
              {!e.is_you ? (
                <span className="ml-1 font-normal text-slate-500">— {e.tag}</span>
              ) : null}
            </span>
          </div>
        ))}
      </div>

      {selected ? (
        <div
          className="mt-5 rounded-xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm sm:p-5"
          style={{ borderLeftWidth: 4, borderLeftColor: selected.color }}
        >
          <h4 className="text-base font-semibold text-slate-900">{selected.name}</h4>
          {selected.url ? (
            <a
              href={selected.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-sm text-indigo-600 underline-offset-2 hover:underline"
            >
              {selected.url}
            </a>
          ) : (
            <p className="mt-1 text-sm text-slate-500">No URL (your submission)</p>
          )}
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{selected.description || "—"}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {STAT_TILES.map((t) => (
              <div
                key={t.key}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-center shadow-sm"
              >
                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{t.label}</div>
                <div className="mt-1 text-lg font-bold tabular-nums text-slate-900">
                  {formatScore(selected[t.key])}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-center text-xs text-slate-500">Click a point on the chart to open details.</p>
      )}
    </section>
  );
}
