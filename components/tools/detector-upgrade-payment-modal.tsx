"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useId, useState } from "react";

const ACCENT = "#7c3aed";

export type DetectorPaymentConfig = {
  storageKey: string;
  heroSrc: string;
  heroAlt: string;
  /** Light purple marketing gradient, or dark panel for forensic-style hero art */
  panelStyle: "light" | "dark";
  subtitle: string;
  features: readonly string[];
  monthlyPrice: string;
  yearlyPrice: string;
  saveLabel: string;
};

type Plan = "monthly" | "yearly";

export type DetectorUpgradePaymentModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  config: DetectorPaymentConfig;
};

export default function DetectorUpgradePaymentModal({
  open,
  onClose,
  onSuccess,
  config,
}: DetectorUpgradePaymentModalProps) {
  const titleId = useId();
  const [plan, setPlan] = useState<Plan>("yearly");
  const [agreedToPay, setAgreedToPay] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const payError = submitAttempted && !agreedToPay ? "Confirm payment authorization to continue." : null;

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

  const handleBackdrop = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    if (!agreedToPay) return;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(config.storageKey, "1");
    }
    setAgreedToPay(false);
    setSubmitAttempted(false);
    setPlan("yearly");
    onSuccess();
  };

  if (!open) return null;

  const planCardClass = (active: boolean) =>
    `flex w-full cursor-pointer items-center gap-3 rounded-2xl border-2 bg-[#1a1a1d] px-4 py-3.5 text-left transition-colors ${
      active ? "" : "border-zinc-700 hover:border-zinc-600"
    }`;

  const isDark = config.panelStyle === "dark";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-4"
      role="presentation"
      onMouseDown={handleBackdrop}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[min(92vh,760px)] w-full max-w-[940px] flex-col overflow-hidden rounded-[22px] shadow-2xl md:max-h-[min(88vh,620px)] md:flex-row"
        style={{
          boxShadow: "0 25px 80px -12px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.06)",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex max-h-[62vh] flex-1 flex-col overflow-y-auto bg-[#121212] md:max-h-none md:w-[44%] md:min-w-[300px]">
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col px-5 py-6 sm:px-7 sm:py-8">
            <h2 id={titleId} className="text-2xl font-bold tracking-tight text-white sm:text-[1.65rem]">
              Upgrade to Business
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{config.subtitle}</p>

            <div className="mt-5">
              <p className="text-sm font-semibold text-white">What you get</p>
              <ul className="mt-2.5 space-y-2">
                {config.features.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13px] leading-snug text-zinc-300">
                    <span
                      className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: ACCENT }}
                    >
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <fieldset className="mt-5 min-w-0 border-0 p-0">
              <legend className="sr-only">Billing plan</legend>
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => setPlan("monthly")}
                  className={planCardClass(plan === "monthly")}
                  style={plan === "monthly" ? { borderColor: ACCENT } : undefined}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                      plan === "monthly" ? "border-white" : "border-zinc-500"
                    }`}
                  >
                    {plan === "monthly" ? (
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ACCENT }} />
                    ) : null}
                  </span>
                  <span className="flex-1 text-sm font-medium text-white">Monthly</span>
                  <span className="text-sm font-semibold tabular-nums text-zinc-200">{config.monthlyPrice}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPlan("yearly")}
                  className={planCardClass(plan === "yearly")}
                  style={plan === "yearly" ? { borderColor: ACCENT } : undefined}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                      plan === "yearly" ? "border-white" : "border-zinc-500"
                    }`}
                  >
                    {plan === "yearly" ? (
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ACCENT }} />
                    ) : null}
                  </span>
                  <span className="flex flex-1 flex-wrap items-center gap-2 text-sm font-medium text-white">
                    Yearly
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                      {config.saveLabel}
                    </span>
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-zinc-200">{config.yearlyPrice}</span>
                </button>
              </div>
            </fieldset>

            <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl border border-zinc-800 bg-[#1a1a1d]/80 px-3 py-2.5">
              <input
                type="checkbox"
                checked={agreedToPay}
                onChange={(e) => setAgreedToPay(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-600 bg-zinc-800 text-violet-600 focus:ring-violet-500 focus:ring-offset-0"
              />
              <span className="text-[12px] leading-relaxed text-zinc-400">
                I authorize payment for the <strong className="text-zinc-300">{plan === "yearly" ? "yearly" : "monthly"}</strong> plan and agree to the{" "}
                <a href="/pages/terms" className="text-zinc-300 underline-offset-2 hover:underline" onClick={(e) => e.stopPropagation()}>
                  Terms of Use
                </a>{" "}
                and{" "}
                <a href="/pages/privacy" className="text-zinc-300 underline-offset-2 hover:underline" onClick={(e) => e.stopPropagation()}>
                  Privacy Policy
                </a>
                .
              </span>
            </label>
            {payError ? <p className="mt-1.5 text-xs text-red-400">{payError}</p> : null}

            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-stretch">
              <button
                type="button"
                onClick={onClose}
                className="order-2 rounded-xl bg-[#2a2a2e] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 sm:order-1 sm:flex-1"
              >
                Maybe Later
              </button>
              <button
                type="submit"
                className="order-1 rounded-xl px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 sm:order-2 sm:flex-1"
                style={{ backgroundColor: ACCENT }}
              >
                Upgrade now
              </button>
            </div>

            <p className="mt-4 text-center text-[11px] leading-relaxed text-zinc-500">
              By continuing, you agree to the{" "}
              <a href="/pages/terms" className="underline-offset-2 hover:text-zinc-400 hover:underline">
                Terms of Use
              </a>{" "}
              and confirm you have read our{" "}
              <a href="/pages/privacy" className="underline-offset-2 hover:text-zinc-400 hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          </form>
        </div>

        <div className="relative flex min-h-[200px] flex-1 flex-col md:min-h-0" style={{ flex: "1 1 56%" }}>
          {isDark ? (
            <>
              <div
                className="absolute inset-0"
                style={{
                  background: "radial-gradient(ellipse 120% 80% at 50% 20%, rgba(45,212,191,0.12), transparent 50%), linear-gradient(165deg, #0a111a 0%, #0f172a 45%, #0a111a 100%)",
                }}
              />
              <div className="pointer-events-none absolute left-1/4 top-0 h-48 w-48 -translate-x-1/2 rounded-full bg-teal-400/15 blur-3xl" />
              <div className="pointer-events-none absolute bottom-0 right-0 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
            </>
          ) : (
            <>
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(160deg, #e9d5ff 0%, #fae8ff 35%, #ddd6fe 70%, #c4b5fd 100%)",
                }}
              />
              <div className="pointer-events-none absolute -left-10 top-1/4 h-40 w-40 rounded-full bg-fuchsia-300/40 blur-3xl" />
              <div className="pointer-events-none absolute bottom-0 right-0 h-48 w-48 rounded-full bg-violet-400/35 blur-3xl" />
            </>
          )}

          <div className="relative flex flex-1 items-center justify-center p-4 sm:p-6 md:p-8">
            <div
              className={`relative mx-auto aspect-[5/4] w-full max-w-lg overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/10 sm:aspect-[16/10] sm:max-h-[min(42vh,380px)] ${
                isDark ? "border border-teal-500/25 bg-slate-950/90" : "border border-white/25 bg-white"
              }`}
            >
              <Image
                src={config.heroSrc}
                alt={config.heroAlt}
                fill
                className="object-contain object-center p-1 sm:p-2"
                sizes="(max-width: 768px) 100vw, 480px"
                priority
              />
            </div>
          </div>

          <div
            className={`relative hidden border-t px-4 py-2.5 md:block ${
              isDark ? "border-teal-500/15 bg-[#070b10]/95" : "border-white/20 bg-[#141416]/90"
            }`}
          >
            <div className="mx-auto max-w-lg">
              <div className={`mb-1 flex justify-between text-[10px] font-medium ${isDark ? "text-teal-200/50" : "text-zinc-500"}`}>
                <span>{isDark ? "0:00" : "5m"}</span>
                <span>{isDark ? "0:05" : "10m"}</span>
              </div>
              <div className={`relative h-6 rounded-md ${isDark ? "bg-slate-900/90" : "bg-zinc-800/90"}`}>
                <div className="absolute left-2 right-2 top-1.5 flex gap-0.5">
                  {[...Array(14)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-sm ${
                        isDark
                          ? i % 2 === 0
                            ? "bg-teal-500/60"
                            : "bg-slate-600/70"
                          : i % 2 === 0
                            ? "bg-violet-500/75"
                            : "bg-fuchsia-400/70"
                      }`}
                    />
                  ))}
                </div>
                <div className={`absolute bottom-0.5 text-[9px] tabular-nums ${isDark ? "left-[42%] text-teal-200/80" : "left-[40%] text-zinc-400"}`}>
                  {isDark ? "0:05" : "6:32:12"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
