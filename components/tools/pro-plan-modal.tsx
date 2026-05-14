"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useState } from "react";

/** Matches `DetectorUpgradePaymentModal` light / video-detector accents */
const ACCENT = "#6366f1";

type PlanId = "weekly" | "lifetime" | "monthly";

export type ProPlanModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function ProPlanModal({ open, onClose }: ProPlanModalProps) {
  const titleId = useId();
  const [plan, setPlan] = useState<PlanId>("lifetime");
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setPlan("lifetime");
      setAuthorized(false);
    }
  }, [open]);

  const handleBackdrop = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  if (!open) return null;

  const planRow = (id: PlanId, title: string, subtitle: string, badge?: string) => {
    const active = plan === id;
    return (
      <button
        type="button"
        key={id}
        onClick={() => setPlan(id)}
        className={`flex w-full items-center gap-3 rounded-2xl border-2 px-3.5 py-3 text-left transition-colors ${
          active ? "border-indigo-400 bg-indigo-50/40 shadow-sm" : "border-slate-200 bg-slate-50 hover:border-slate-300"
        }`}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${
            active ? "border-indigo-500 bg-indigo-50" : "border-slate-400 bg-white"
          }`}
        >
          {active ? (
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ACCENT }} />
          ) : (
            <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block text-sm font-bold ${active ? "text-indigo-700" : "text-slate-900"}`}>{title}</span>
          <span className={`mt-0.5 block text-xs ${active ? "text-indigo-600/90" : "text-slate-600"}`}>{subtitle}</span>
        </span>
        {badge ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-800">
            <svg className="h-3 w-3 text-emerald-700" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2l2.2 6.8h7.1l-5.7 4.1 2.2 6.9-5.8-4.2-5.8 4.2 2.2-6.9-5.7-4.1h7.1z" />
            </svg>
            {badge}
          </span>
        ) : null}
      </button>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/45 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={handleBackdrop}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[min(100dvh,820px)] w-full max-w-md flex-col overflow-hidden rounded-t-[22px] border border-slate-200/90 bg-white shadow-2xl ring-1 ring-slate-200/60 sm:max-h-[min(92vh,760px)] sm:rounded-[22px]"
        style={{
          boxShadow: "0 25px 60px -12px rgba(15,23,42,0.12), 0 0 0 1px rgba(226,232,240,0.9)",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute left-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm ring-1 ring-slate-200/80 transition hover:bg-white"
            aria-label="Close"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>

          <div className="relative h-[min(36vh,260px)] w-full overflow-hidden sm:h-[220px]">
            <Image
              src="/images/pro-plan-modal-hero.png"
              alt=""
              fill
              className="object-cover object-[center_22%]"
              sizes="(max-width: 640px) 100vw, 448px"
              priority
            />
            {/* Same indigo/sky wash family as video detector light hero panel */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(238,242,255,0.15) 0%, rgba(224,231,255,0.45) 35%, rgba(255,255,255,0.88) 78%, #ffffff 100%), linear-gradient(135deg, rgba(99,102,241,0.12) 0%, transparent 50%)",
              }}
            />
            <div className="pointer-events-none absolute -right-6 bottom-0 h-28 w-28 rounded-full bg-sky-200/50 blur-2xl" />
            <div className="pointer-events-none absolute -left-4 top-1/3 h-24 w-24 rounded-full bg-indigo-200/45 blur-2xl" />
          </div>

          <div
            className="relative z-10 -mt-12 bg-gradient-to-b from-white via-white to-indigo-50/20 px-5 pb-2 pt-1 text-center sm:-mt-10"
            style={{
              background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 55%, #f1f5f9 100%)",
            }}
          >
            <h2 id={titleId} className="text-xl font-bold leading-tight tracking-tight text-slate-900 sm:text-[1.35rem]">
              Experience deeper detection with Pro
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">Choose a plan</p>
          </div>
        </div>

        <div
          className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 pb-5 pt-1"
          style={{
            background: "linear-gradient(160deg, #eef2ff 0%, #e0e7ff 18%, #f8fafc 42%, #ffffff 100%)",
          }}
        >
          <div className="flex flex-col gap-2.5">
            {planRow("weekly", "$9.99 / week", "Get 7 free days of trial")}
            {planRow("lifetime", "$199 / lifetime", "Billed once", "Save 85%")}
            {planRow("monthly", "$29 / month", "Get 7 free days of trial")}
          </div>

          <label className="mt-1 flex cursor-pointer items-start gap-3 rounded-xl border border-indigo-100 bg-slate-50 px-3 py-2.5">
            <input
              type="checkbox"
              checked={authorized}
              onChange={(e) => setAuthorized(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 bg-white text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
            />
            <span className="text-left text-[12px] leading-relaxed text-slate-600">
              I authorize payment for the selected plan and agree to the{" "}
              <a
                href="/pages/terms"
                className="text-indigo-700 underline-offset-2 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Terms of Use
              </a>{" "}
              and{" "}
              <a
                href="/pages/privacy"
                className="text-indigo-700 underline-offset-2 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Privacy Policy
              </a>
              .
            </span>
          </label>

          <button
            type="button"
            onClick={onClose}
            className="mt-1 w-full rounded-xl py-3.5 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90 active:scale-[0.99]"
            style={{ backgroundColor: ACCENT }}
          >
            Start free trial
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-200 py-2.5 text-center text-sm font-medium text-slate-800 transition-colors hover:bg-slate-300"
          >
            Maybe later
          </button>

          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
            <a href="/pages/terms" className="text-indigo-600 underline-offset-2 hover:text-indigo-700 hover:underline">
              Terms
            </a>
            <span aria-hidden>·</span>
            <a href="/pages/privacy" className="text-indigo-600 underline-offset-2 hover:text-indigo-700 hover:underline">
              Privacy Policy
            </a>
            <span aria-hidden>·</span>
            <button type="button" onClick={onClose} className="text-indigo-600 underline-offset-2 hover:text-indigo-700 hover:underline">
              Restore
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
