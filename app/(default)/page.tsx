export const metadata = {
  title: "RealEye - Advanced Deepfake Detection",
  description: "Detect AI-generated videos with cutting-edge deep learning technology. Verify video authenticity and combat misinformation.",
};

import PageIllustration from "@/components/page-illustration";
import Hero from "@/components/hero-home";
import Workflows from "@/components/workflows";
import Features from "@/components/features";
import Testimonials from "@/components/testimonials";
import Cta from "@/components/cta";

export default function Home() {
  return (
    <>
      <PageIllustration />
      <Hero />
      <Workflows />
      <Features />
      <Testimonials />
      <Cta />
    </>
  );
}
