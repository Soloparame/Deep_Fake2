"use client";

import DetectorUpgradePaymentModal, { type DetectorPaymentConfig } from "@/components/tools/detector-upgrade-payment-modal";

const IMAGE_CONFIG: DetectorPaymentConfig = {
  persistCompletion: false,
  heroSrc: "/images/fake-image-detector-hero.png",
  heroAlt: "Image authenticity and forensic analysis preview",
  panelStyle: "light",
  leftPanel: "light",
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
