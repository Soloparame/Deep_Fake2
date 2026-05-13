"use client";

import DetectorUpgradePaymentModal, { type DetectorPaymentConfig } from "@/components/tools/detector-upgrade-payment-modal";

export const VIDEO_DETECTOR_PAYMENT_KEY = "realeye_fake_video_payment_gate_v1";

export function hasVideoDetectorPaymentPassed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(VIDEO_DETECTOR_PAYMENT_KEY) === "1";
}

const VIDEO_CONFIG: DetectorPaymentConfig = {
  storageKey: VIDEO_DETECTOR_PAYMENT_KEY,
  heroSrc: "/images/fake-video-detector-hero.png",
  heroAlt: "DeepFake Detector product preview",
  panelStyle: "light",
  subtitle: "Full-scale AI hiring for up to 500 interviews per month with unlimited #users.",
  features: [
    "250 interviews / month",
    "Unlimited # users",
    "AI Insights",
    "AI Interview Coach",
    "200+ languages",
    "ATS Integration",
  ],
  monthlyPrice: "$997 /month",
  yearlyPrice: "$8,999 /year",
  saveLabel: "Save 25%",
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function VideoDetectorPaymentModal(props: Props) {
  return <DetectorUpgradePaymentModal {...props} config={VIDEO_CONFIG} />;
}
