"use client";

import DetectorUpgradePaymentModal, { type DetectorPaymentConfig } from "@/components/tools/detector-upgrade-payment-modal";

export const IMAGE_DETECTOR_PAYMENT_KEY = "realeye_fake_image_payment_gate_v1";

export function hasImageDetectorPaymentPassed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(IMAGE_DETECTOR_PAYMENT_KEY) === "1";
}

const IMAGE_CONFIG: DetectorPaymentConfig = {
  storageKey: IMAGE_DETECTOR_PAYMENT_KEY,
  heroSrc: "/images/fake-image-detector-hero.png",
  heroAlt: "Image authenticity and forensic analysis preview",
  panelStyle: "dark",
  subtitle: "Full-scale image integrity checks with EXIF intelligence, temporal signals, and unlimited team seats.",
  features: [
    "200+ video avatars",
    "Unlimited minutes",
    "4K quality",
    "4K video download",
    "20+ languages",
    "Priority support",
  ],
  monthlyPrice: "$227 /month",
  yearlyPrice: "$2,000 /year",
  saveLabel: "Save 20%",
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ImageDetectorPaymentModal(props: Props) {
  return <DetectorUpgradePaymentModal {...props} config={IMAGE_CONFIG} />;
}
