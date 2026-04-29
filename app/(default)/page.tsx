export const metadata = {
  title: "Multi-modal AI Integrity Suite - Media Authenticity + Project Intel",
  description:
    "Detect deepfake videos and AI-generated images, then run Project Intel for similarity, competitor discovery, and strategy insights.",
};

import PageIllustration from "@/components/page-illustration";
import Hero from "@/components/hero-home";
import TrustedStrip from "@/components/trusted-strip";
import Workflows from "@/components/workflows";
import Features from "@/components/features";
import Testimonials from "@/components/testimonials";

export default function Home() {
  return (
    <>
      <PageIllustration />
      <Hero />
      <TrustedStrip />
      <Workflows />
      <Features />
      <Testimonials />
    </>
  );
}
