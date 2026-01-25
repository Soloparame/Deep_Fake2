import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const pages = [
    "how-it-works",
    "features",
    "pricing",
    "api-access",
    "documentation",
    "about-us",
    "research",
    "blog",
    "careers",
    "contact",
    "community",
    "terms-of-service",
    "privacy-policy",
    "security",
    "help-center",
    "tutorials",
    "faq",
    "report-issue",
    "learn-more",
  ];

  return pages.map((slug) => ({
    slug: slug,
  }));
}

function ContentCard({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-gray-900/60 backdrop-blur-xl p-1 transition-all hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-2xl ${className}`}>
      <div className="h-full rounded-xl bg-gray-950/80 p-6">
        {children}
      </div>
    </div>
  );
}

function PremiumPage({ title, description, children }: { title: string, description: string, children: React.ReactNode }) {
  return (
    <section className="relative min-h-screen overflow-hidden pt-32 pb-12 md:pt-40 md:pb-20">
      {/* Background Decor - matching upload page style */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-[20%] top-[20%] h-96 w-96 rounded-full bg-indigo-600/10 blur-[100px] animate-pulse"></div>
        <div className="absolute right-[20%] bottom-[20%] h-64 w-64 rounded-full bg-violet-600/10 blur-[80px]"></div>
      </div>
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h1 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-4 font-nacelle text-4xl font-bold text-transparent md:text-5xl">
            {title}
          </h1>
          <p className="text-xl text-indigo-200/65">{description}</p>
        </div>

        <div className="mx-auto">
          {children}
        </div>
      </div>
    </section>
  );
}

// removed duplicate early pricing block

const pageContent: Record<string, { title: string; content: string }> = {
  "how-it-works": {
    title: "How It Works",
    content: "RealEye uses advanced deep learning algorithms to analyze video frames for artifacts commonly found in deepfakes. Our model checks for inconsistencies in lighting, facial movements, and pixel-level details that are invisible to the human eye.",
  },
  features: {
    title: "Features",
    content: "Our platform offers real-time detection, high accuracy rates, detailed analysis reports, and API access for developers. We support various video formats and provide frame-by-frame analysis.",
  },
  pricing: {
    title: "Pricing",
    content: "We offer flexible pricing plans for individuals, businesses, and enterprise needs. Contact our sales team for custom solutions.",
  },
  "api-access": {
    title: "API Access",
    content: "Integrate RealEye's detection capabilities into your own applications with our robust API. Read our documentation to get started.",
  },
  documentation: {
    title: "Documentation",
    content: "Comprehensive guides and references for using the RealEye platform and API.",
  },
  "about-us": {
    title: "About Us",
    content: "RealEye is dedicated to combating misinformation and protecting digital authenticity. Our team consists of AI researchers and security experts.",
  },
  research: {
    title: "Research",
    content: "Explore our latest research papers and findings in the field of deepfake detection and media forensics.",
  },
  blog: {
    title: "Blog",
    content: "Stay updated with the latest news, trends, and insights from the RealEye team.",
  },
  careers: {
    title: "Careers",
    content: "Join our mission to secure the digital world. Check out our open positions.",
  },
  contact: {
    title: "Contact",
    content: "Get in touch with us for support, inquiries, or feedback.",
  },
  community: {
    title: "Community",
    content: "Join our community of developers and researchers to collaborate and share knowledge.",
  },
  "terms-of-service": {
    title: "Terms of Service",
    content: "Please read our terms of service carefully before using our platform.",
  },
  "privacy-policy": {
    title: "Privacy Policy",
    content: "We value your privacy. Learn how we collect, use, and protect your data.",
  },
  security: {
    title: "Security",
    content: "Security is our top priority. Learn about our security measures and compliance.",
  },
  "help-center": {
    title: "Help Center",
    content: "Find answers to common questions and learn how to use RealEye effectively.",
  },
  tutorials: {
    title: "Tutorials",
    content: "Step-by-step tutorials to help you get the most out of RealEye.",
  },
  faq: {
    title: "FAQ",
    content: "Frequently asked questions about deepfakes, our technology, and account management.",
  },
  "report-issue": {
    title: "Report Issue",
    content: "Encountered a bug or issue? Let us know so we can fix it.",
  },
  "learn-more": {
    title: "Learn More",
    content: "Discover how RealEye is revolutionizing media authenticity. From individual creators to large enterprises, our tools provide the assurance you need in a digital world.",
  },
};

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = pageContent[slug];

  if (!data) {
    notFound();
  }

  if (slug === "how-it-works") {
    return (
      <PremiumPage
        title="How It Works"
        description="Our platform analyzes videos using advanced AI models to detect manipulation and provide reliable authenticity results in seconds. Built for speed, accuracy, and transparency, RealEye uses deep learning to evaluate videos in a clear, explainable pipeline."
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Step 1: Upload the Video */}
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Step 1: Upload the Video</h2>
            <p className="mt-2 text-sm text-gray-300">
              Upload via the website or API. Supported formats include MP4, MOV, AVI, and WebM. File sizes are limited for performance and reliability.
            </p>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Simple upload process with progress feedback</li>
              <li>Data encryption in transit</li>
              <li>Private and secure handling of uploads</li>
            </ul>
          </ContentCard>

          {/* Step 2: Video Preprocessing */}
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Step 2: Video Preprocessing</h2>
            <p className="mt-2 text-sm text-gray-300">
              Videos are standardized and cleaned for consistent model input. Resolution, frame rate, and basic quality checks are aligned to ensure dependable analysis.
            </p>
            <p className="mt-2 text-xs text-indigo-200/65">
              This step improves detection performance and accuracy across a wide range of sources.
            </p>
          </ContentCard>

          {/* Step 3: Frame Extraction */}
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Step 3: Frame Extraction</h2>
            <p className="mt-2 text-sm text-gray-300">
              The video is split into frames and key frames are selected for analysis. Working at the frame level helps catch subtle manipulations.
            </p>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Key-frame selection to focus on meaningful frames</li>
              <li>Performance-optimized sampling for fast processing</li>
            </ul>
          </ContentCard>

          {/* Step 4: Face Detection & Tracking */}
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Step 4: Face Detection & Tracking</h2>
            <p className="mt-2 text-sm text-gray-300">
              Faces are detected and tracked across frames to focus analysis on regions most commonly manipulated in deepfakes.
            </p>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Multi-face support</li>
              <li>Face alignment for consistent evaluation</li>
              <li>Stability across movements and scene changes</li>
            </ul>
          </ContentCard>

          {/* Step 5: Deepfake AI Analysis */}
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Step 5: Deepfake AI Analysis</h2>
            <p className="mt-2 text-sm text-gray-300">
              Core AI models analyze facial patterns to detect artifacts and inconsistencies, trained on real and fake datasets for robust generalization.
            </p>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Texture and pixel-level inconsistency checks</li>
              <li>Lip-sync and eye-blinking patterns</li>
              <li>Confidence aggregation across frames</li>
            </ul>
          </ContentCard>

          {/* Step 6: Confidence Score Generation */}
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Step 6: Confidence Score Generation</h2>
            <p className="mt-2 text-sm text-gray-300">
              Results across frames are combined into a final probability score, reflecting the likelihood of manipulation.
            </p>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Score meaning: Real / Suspicious / Fake</li>
              <li>High transparency in how decisions are made</li>
            </ul>
          </ContentCard>

          {/* Step 7: Authenticity Report */}
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Step 7: Authenticity Report</h2>
            <p className="mt-2 text-sm text-gray-300">
              A full report is generated with the confidence score, summary of analysis, and highlighted frames that triggered suspicious indicators.
            </p>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Detailed analysis summary</li>
              <li>Highlighted suspicious frames</li>
              <li>Downloadable PDF for documentation or verification</li>
            </ul>
          </ContentCard>

          {/* Step 8: Result Storage & History */}
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Step 8: Result Storage & History</h2>
            <p className="mt-2 text-sm text-gray-300">
              Results are saved per user to enable history access and evidence tracking, with strong privacy safeguards.
            </p>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Detection history per account</li>
              <li>Re-access previous reports</li>
              <li>Privacy-first storage policies</li>
            </ul>
          </ContentCard>

          {/* Step 9: API Workflow (Optional) */}
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Step 9: API Workflow (Optional)</h2>
            <p className="mt-2 text-sm text-gray-300">
              The same pipeline is available via API for integrations, returning JSON results suitable for automation.
            </p>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>JSON output with scores and labels</li>
              <li>Easy integration into apps and services</li>
              <li>Support for automated workflows</li>
            </ul>
          </ContentCard>

          {/* Ethical & Trust */}
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Ethical & Trust</h2>
            <p className="mt-2 text-sm text-gray-300">
              We practice responsible AI and transparent decision-making. Data is never misused and our training procedures are bias-aware.
            </p>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Privacy-first approach</li>
              <li>Transparent decision process</li>
              <li>Bias-aware training methodologies</li>
            </ul>
          </ContentCard>

          {/* Visual Flow Diagram */}
          <div className="md:col-span-2 lg:col-span-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 p-6 text-center">
            <h2 className="text-xl font-semibold text-white">Pipeline Overview</h2>
            <p className="mt-2 text-indigo-200">
              Upload → Preprocess → Extract Frames → Detect Faces → AI Analysis → Score → Report → Save
            </p>
          </div>
        </div>
      </PremiumPage>
    );
  }

  if (slug === "features") {
    return (
      <PremiumPage
        title="Features"
        description="Powerful AI-driven detection, built for accuracy, speed, and trust. Our Deepfake Video Detection platform combines advanced artificial intelligence, secure infrastructure, and intuitive design to deliver reliable authenticity verification."
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">1. Real-Time Deepfake Detection</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Instant video processing after upload</li>
              <li>Optimized inference pipeline for fast predictions</li>
              <li>Live progress tracking during analysis</li>
              <li>Suitable for time-sensitive verification</li>
            </ul>
            <p className="mt-2 text-sm text-gray-300">Speed is critical when verifying digital content. Real-time detection prevents misinformation from spreading.</p>
          </ContentCard>

          <ContentCard>
            <h2 className="text-xl font-semibold text-white">2. High Accuracy AI Models</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Trained on large-scale real and manipulated datasets</li>
              <li>Detects face swaps, GAN videos, lip-sync manipulation, reenactment</li>
              <li>Continuous improvements via research updates</li>
            </ul>
            <p className="mt-2 text-sm text-gray-300">High accuracy builds confidence and ensures professional reliability.</p>
          </ContentCard>

          <ContentCard>
            <h2 className="text-xl font-semibold text-white">3. Frame-by-Frame Video Analysis</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Analyzes videos at the frame level</li>
              <li>Detects micro-level visual inconsistencies</li>
              <li>Identifies subtle manipulations invisible to the eye</li>
            </ul>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Facial texture irregularities</li>
              <li>Lighting inconsistencies</li>
              <li>Blending artifacts</li>
              <li>Motion distortions</li>
            </ul>
            <p className="mt-2 text-sm text-gray-300">Deepfakes hide in small details. Frame-level analysis exposes them.</p>
          </ContentCard>

          <ContentCard>
            <h2 className="text-xl font-semibold text-white">4. Detailed Authenticity Reports</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Final detection result</li>
              <li>Confidence score</li>
              <li>Frame-level predictions</li>
              <li>Highlighted suspicious regions</li>
              <li>Analysis summary and timestamps</li>
            </ul>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Legal verification</li>
              <li>Journalism investigations</li>
              <li>Academic research</li>
              <li>Evidence documentation</li>
            </ul>
          </ContentCard>

          <ContentCard>
            <h2 className="text-xl font-semibold text-white">5. Confidence Scoring System</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Probability-based classification</li>
              <li>Authentic / Suspicious / Manipulated</li>
              <li>Data-driven, not opinion-based</li>
            </ul>
            <p className="mt-2 text-sm text-gray-300">Understand not just the result, but how strong it is.</p>
          </ContentCard>

          <ContentCard>
            <h2 className="text-xl font-semibold text-white">6. Multi-Format Video Support</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>MP4, AVI, MOV, MKV, WebM</li>
              <li>Automatic handling of resolutions, frame rates, compression</li>
            </ul>
            <p className="mt-2 text-sm text-gray-300">No need to convert videos manually. The platform handles it.</p>
          </ContentCard>

          <ContentCard>
            <h2 className="text-xl font-semibold text-white">7. Secure User History & Storage</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Every scan saved per user</li>
              <li>Access previous reports anytime</li>
              <li>Evidence archiving</li>
              <li>Encrypted data storage</li>
            </ul>
          </ContentCard>

          <ContentCard>
            <h2 className="text-xl font-semibold text-white">8. Developer API Access</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>RESTful API</li>
              <li>JSON responses</li>
              <li>Upload via endpoint</li>
              <li>Fetch results and reports programmatically</li>
            </ul>
          </ContentCard>

          <ContentCard>
            <h2 className="text-xl font-semibold text-white">9. Scalable Infrastructure</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Handles individual and enterprise workloads</li>
              <li>Cloud-based processing</li>
              <li>Auto-scaling pipelines</li>
              <li>High availability</li>
            </ul>
          </ContentCard>

          <ContentCard>
            <h2 className="text-xl font-semibold text-white">10. Privacy & Data Protection</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Encrypted uploads</li>
              <li>User-isolated storage</li>
              <li>No resale of data</li>
              <li>Optional auto-deletion policies</li>
            </ul>
          </ContentCard>

          <ContentCard>
            <h2 className="text-xl font-semibold text-white">11. Explainable AI Results</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Clear breakdown of results</li>
              <li>Visual evidence of manipulations</li>
              <li>Confidence transparency</li>
            </ul>
          </ContentCard>

          <ContentCard>
            <h2 className="text-xl font-semibold text-white">12. User-Friendly Interface</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Simple upload process</li>
              <li>Dashboard with history</li>
              <li>Report downloads</li>
              <li>Progress visualization</li>
            </ul>
          </ContentCard>
        </div>
      </PremiumPage>
    );
  }

  if (slug === "pricing") {
    return (
      <PremiumPage
        title="Pricing"
        description="Flexible, fair, and transparent plans for professional deepfake video detection. Choose the plan that matches your workload and compliance requirements."
      >
        <div>
          <p className="mt-3 text-center text-gray-300 mb-10 max-w-3xl mx-auto">
            Our platform offers real-time deepfake detection, high accuracy AI analysis, detailed authenticity reports, secure storage, and API access for automation and integration.
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-16">
            <div className="rounded-xl border border-white/10 p-6 bg-white/5 backdrop-blur-sm hover:border-indigo-500/50 transition-colors">
              <h2 className="text-lg font-semibold text-white">Free / Trial</h2>
              <p className="mt-1 text-sm text-gray-400">Individuals evaluating the platform</p>
              <div className="mt-3 text-2xl font-bold text-indigo-400">$0</div>
              <ul className="mt-4 space-y-2 text-sm text-indigo-200/70">
                <li>Limited monthly analyses</li>
                <li>Basic authenticity report</li>
                <li>Frame-level preview</li>
                <li>Community features</li>
              </ul>
              <ul className="mt-4 space-y-1 text-xs text-gray-500">
                <li>API: limited requests</li>
                <li>Storage: short retention</li>
                <li>Support: community</li>
              </ul>
            </div>

            <div className="rounded-xl border border-indigo-500/50 p-6 bg-indigo-500/10 backdrop-blur-sm shadow-lg shadow-indigo-500/20 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 px-3 py-1 text-xs font-bold text-white rounded-full">POPULAR</div>
              <h2 className="text-lg font-semibold text-white">Basic</h2>
              <p className="mt-1 text-sm text-gray-400">Creators and professionals</p>
              <div className="mt-3 text-2xl font-bold text-indigo-400">$29/month</div>
              <ul className="mt-4 space-y-2 text-sm text-indigo-200/70">
                <li>Real-time detection</li>
                <li>Full authenticity reports</li>
                <li>Confidence scoring</li>
                <li>Multi-format support</li>
              </ul>
              <ul className="mt-4 space-y-1 text-xs text-gray-500">
                <li>API: moderate limits</li>
                <li>Storage: standard retention</li>
                <li>Support: standard</li>
              </ul>
            </div>

            <div className="rounded-xl border border-white/10 p-6 bg-white/5 backdrop-blur-sm hover:border-indigo-500/50 transition-colors">
              <h2 className="text-lg font-semibold text-white">Pro</h2>
              <p className="mt-1 text-sm text-gray-400">Agencies and teams</p>
              <div className="mt-3 text-2xl font-bold text-indigo-400">$99/month</div>
              <ul className="mt-4 space-y-2 text-sm text-indigo-200/70">
                <li>Priority processing</li>
                <li>Advanced frame-level data</li>
                <li>Report exports (PDF)</li>
                <li>Audit trails</li>
              </ul>
              <ul className="mt-4 space-y-1 text-xs text-gray-500">
                <li>API: higher limits</li>
                <li>Storage: extended retention</li>
                <li>Support: priority</li>
              </ul>
            </div>

            <div className="rounded-xl border border-white/10 p-6 bg-white/5 backdrop-blur-sm hover:border-indigo-500/50 transition-colors">
              <h2 className="text-lg font-semibold text-white">Enterprise</h2>
              <p className="mt-1 text-sm text-gray-400">Large-scale and regulated environments</p>
              <div className="mt-3 text-2xl font-bold text-indigo-400">Custom</div>
              <ul className="mt-4 space-y-2 text-sm text-indigo-200/70">
                <li>SLA-backed performance</li>
                <li>Private deployments</li>
                <li>Compliance tooling</li>
                <li>Custom integrations</li>
              </ul>
              <ul className="mt-4 space-y-1 text-xs text-gray-500">
                <li>API: enterprise limits</li>
                <li>Storage: configurable</li>
                <li>Support: dedicated</li>
              </ul>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <ContentCard>
              <h3 className="text-lg font-semibold text-white">Usage-Based Pricing</h3>
              <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
                <li>Fair billing aligned to processing volume</li>
                <li>Overage options for burst workloads</li>
              </ul>
            </ContentCard>
            <ContentCard>
              <h3 className="text-lg font-semibold text-white">API Request Limits</h3>
              <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
                <li>Tiered per plan</li>
                <li>Rate limiting for stability</li>
              </ul>
            </ContentCard>
            <ContentCard>
              <h3 className="text-lg font-semibold text-white">Video Size Limits</h3>
              <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
                <li>Optimized for practical workloads</li>
                <li>Higher limits available on Enterprise</li>
              </ul>
            </ContentCard>
            <ContentCard>
              <h3 className="text-lg font-semibold text-white">Storage Duration</h3>
              <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
                <li>Per-user history and retention policies</li>
                <li>Configurable archiving options</li>
              </ul>
            </ContentCard>
            <ContentCard>
              <h3 className="text-lg font-semibold text-white">Upgrade & Downgrade Policy</h3>
              <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
                <li>Plan changes take effect next cycle</li>
                <li>Pro-rated adjustments where applicable</li>
              </ul>
            </ContentCard>
            <ContentCard>
              <h3 className="text-lg font-semibold text-white">Refund Policy</h3>
              <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
                <li>High-level: refunds assessed case-by-case</li>
                <li>Service credits for SLA breaches</li>
              </ul>
            </ContentCard>
            <div className="md:col-span-2 lg:col-span-3 rounded-2xl bg-indigo-900/20 border border-indigo-500/20 p-6 text-center">
              <h3 className="text-lg font-semibold text-white">Fair and Scalable</h3>
              <p className="mt-2 text-sm text-gray-300">
                Transparent pricing ensures you pay only for what you use, with predictable limits and enterprise scalability.
              </p>
            </div>
          </div>
        </div>
      </PremiumPage>
    );
  }

  if (slug === "api-access") {
    return (
      <PremiumPage
        title="API Access"
        description="Programmatic access to the deepfake detection pipeline for automation, integration, and large-scale processing."
      >
        <div className="space-y-12">
          <p className="text-center text-lg text-gray-300 max-w-3xl mx-auto">
            The API provides direct access to our deepfake detection pipeline, enabling automated video verification, large-scale processing, and integration into third-party applications.
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <ContentCard>
              <h2 className="text-xl font-semibold text-white">What the API Does</h2>
              <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
                <li>Upload videos</li>
                <li>Trigger analysis</li>
                <li>Receive detection results</li>
                <li>Fetch confidence scores and reports</li>
              </ul>
            </ContentCard>

            <ContentCard>
              <h2 className="text-xl font-semibold text-white">Key API Features</h2>
              <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
                <li>RESTful design</li>
                <li>JSON responses</li>
                <li>Secure authentication</li>
                <li>Scalable performance</li>
              </ul>
            </ContentCard>

            <ContentCard>
              <h2 className="text-xl font-semibold text-white">Typical API Workflow</h2>
              <ul className="mt-3 list-decimal pl-4 text-xs text-indigo-200/65">
                <li>Authenticate</li>
                <li>Upload video</li>
                <li>Get job ID</li>
                <li>Poll status</li>
                <li>Receive results</li>
              </ul>
            </ContentCard>

            <ContentCard>
              <h2 className="text-xl font-semibold text-white">Response Data</h2>
              <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
                <li>Detection result</li>
                <li>Confidence score</li>
                <li>Frame-level data</li>
                <li>Report URLs</li>
              </ul>
            </ContentCard>

            <ContentCard>
              <h2 className="text-xl font-semibold text-white">Security & Authentication</h2>
              <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
                <li>API keys or bearer tokens</li>
                <li>Rate limiting</li>
                <li>Encrypted transmission</li>
              </ul>
            </ContentCard>

            <ContentCard>
              <h2 className="text-xl font-semibold text-white">Use Cases</h2>
              <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
                <li>Media platforms</li>
                <li>News agencies</li>
                <li>Government verification</li>
                <li>Social networks</li>
                <li>Mobile apps</li>
              </ul>
            </ContentCard>

            <ContentCard>
              <h2 className="text-xl font-semibold text-white">Rate Limits & Plans</h2>
              <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
                <li>Free vs paid API tiers</li>
                <li>Request limits per plan</li>
                <li>Processing limits based on workload</li>
              </ul>
            </ContentCard>

            <ContentCard>
              <h2 className="text-xl font-semibold text-white">Developer Resources</h2>
              <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
                <li>SDKs and client libraries</li>
                <li>Sample requests</li>
                <li>Documentation links</li>
                <li>Support channels</li>
              </ul>
            </ContentCard>
          </div>
        </div>
      </PremiumPage>
    );
  }

  if (slug === "documentation") {
    return (
      <PremiumPage
        title="Documentation"
        description="Authoritative technical reference for using the platform and API in production environments."
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Getting Started</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Account creation and authentication</li>
              <li>Uploading videos via web and API</li>
              <li>Retrieving detection results</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">API Endpoints Overview</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Video upload</li>
              <li>Job status</li>
              <li>Result retrieval</li>
              <li>Report export</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Authentication</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Bearer tokens</li>
              <li>Key rotation</li>
              <li>Access scopes</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Rate Limits</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Per-tier request ceilings</li>
              <li>Burst protection</li>
              <li>429 handling</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Errors</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Standard HTTP status codes</li>
              <li>Structured error payloads</li>
              <li>Retry strategies</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">SDKs and Tools</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Client libraries</li>
              <li>Code samples</li>
              <li>CLI utilities</li>
            </ul>
          </ContentCard>
        </div>
      </PremiumPage>
    );
  }

  if (slug === "about-us") {
    return (
      <PremiumPage
        title="About Us"
        description="Building trustworthy AI to protect digital authenticity across media and society."
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Mission</h2>
            <p className="mt-3 text-sm text-gray-300">
              Enable reliable deepfake detection at scale through research-driven engineering and secure design.
            </p>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Values</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Integrity and transparency</li>
              <li>Privacy-first architecture</li>
              <li>Responsible and unbiased AI</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Commitment</h2>
            <p className="mt-3 text-sm text-gray-300">
              Serve individuals, media, and institutions with tools that are dependable, verifiable, and secure.
            </p>
          </ContentCard>
        </div>
      </PremiumPage>
    );
  }

  if (slug === "research") {
    return (
      <PremiumPage
        title="Research"
        description="Advancing state-of-the-art deepfake detection through rigorous experimentation and open evaluation."
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Focus Areas</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Robustness to compression and noise</li>
              <li>Cross-model generalization</li>
              <li>Explainability and confidence calibration</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Datasets</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Curated real and synthetic video corpora</li>
              <li>Balanced demographics and scenarios</li>
              <li>Ethically sourced and documented</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Methodology</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Reproducible pipelines</li>
              <li>Peer-reviewed benchmarks</li>
              <li>Public reporting of findings</li>
            </ul>
          </ContentCard>
        </div>
      </PremiumPage>
    );
  }

  if (slug === "blog") {
    return (
      <PremiumPage
        title="Blog"
        description="Expert insights on deepfake detection, media integrity, and trustworthy AI."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Editorial Areas</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Technology and research notes</li>
              <li>Industry trends and case studies</li>
              <li>Best practices and guides</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Newsletter</h2>
            <p className="mt-3 text-sm text-gray-300">
              Periodic updates covering product improvements, benchmarks, and ecosystem developments.
            </p>
          </ContentCard>
        </div>
      </PremiumPage>
    );
  }

  if (slug === "careers") {
    return (
      <PremiumPage
        title="Careers"
        description="Join a mission-driven team building secure and reliable AI for media integrity."
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Open Roles</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Engineering</li>
              <li>Applied Research</li>
              <li>Product and Design</li>
              <li>Operations and Support</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Benefits</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Flexible work arrangements</li>
              <li>Learning and research support</li>
              <li>Inclusive and equitable culture</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Hiring Process</h2>
            <ul className="mt-3 list-decimal pl-4 text-xs text-indigo-200/65">
              <li>Application review</li>
              <li>Technical assessment</li>
              <li>Team interviews</li>
              <li>Offer and onboarding</li>
            </ul>
          </ContentCard>
        </div>
      </PremiumPage>
    );
  }

  if (slug === "contact") {
    return (
      <PremiumPage
        title="Contact"
        description="Professional support and inquiries for product, partnerships, and media."
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Support</h2>
            <p className="mt-3 text-sm text-gray-300">Email assistance for account and technical questions.</p>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Sales</h2>
            <p className="mt-3 text-sm text-gray-300">Engage our team for enterprise and custom deployments.</p>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Press and Security</h2>
            <p className="mt-3 text-sm text-gray-300">Media contacts and responsible disclosure for security findings.</p>
          </ContentCard>
        </div>
      </PremiumPage>
    );
  }

  if (slug === "community") {
    return (
      <PremiumPage
        title="Community"
        description="A professional space for learning, contributing, and advancing deepfake detection together."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Participation</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Access interactive challenges to practice identifying manipulations</li>
              <li>Share responsible feedback and research findings</li>
              <li>Collaborate on best practices and tooling</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Guidelines</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Professional, respectful interactions</li>
              <li>No harassment, personal attacks, or unsafe content</li>
              <li>Follow privacy and security standards</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Moderation</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Content reviewed for safety and compliance</li>
              <li>Enforcement of acceptable use and community rules</li>
              <li>Escalation paths for violations</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Contributions</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Share datasets responsibly</li>
              <li>Propose feature enhancements</li>
              <li>Participate in research and benchmarking</li>
            </ul>
          </ContentCard>
        </div>
      </PremiumPage>
    );
  }

  if (slug === "terms-of-service") {
    return (
      <PremiumPage
        title="Terms of Service"
        description="Binding terms governing access and use of the platform and API."
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Acceptable Use</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>No misuse, illegal activity, or attempts to bypass safeguards</li>
              <li>No unauthorized redistribution of results or data</li>
              <li>Respect intellectual property and privacy rights</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Accounts and Access</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Keep credentials secure</li>
              <li>Use authorized endpoints only</li>
              <li>Comply with rate limits and plan constraints</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Intellectual Property</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Platform, models, and content protected by applicable laws</li>
              <li>Permissions granted under selected plan</li>
              <li>No reverse engineering or derivative misuse</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Service Availability</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Reasonable efforts to maintain uptime</li>
              <li>Maintenance windows and notifications</li>
              <li>SLA terms for Enterprise</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Liability and Warranty</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Service provided “as is” unless specified by SLA</li>
              <li>Limitations on indirect or consequential damages</li>
              <li>Compliance with applicable law</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Governing Law</h2>
            <p className="mt-3 text-sm text-gray-300">
              Disputes resolved under applicable jurisdiction and arbitration terms where defined.
            </p>
          </ContentCard>
        </div>
      </PremiumPage>
    );
  }

  if (slug === "privacy-policy") {
    return (
      <PremiumPage
        title="Privacy Policy"
        description="Transparent practices for data collection, processing, storage, and user rights."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Data Collected</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Account information and authentication details</li>
              <li>Uploaded videos and derived analysis data</li>
              <li>Usage metrics and diagnostic logs</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Processing and Use</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Video analysis for authenticity detection</li>
              <li>Report generation and history</li>
              <li>Service improvement with privacy safeguards</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Retention</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Per-plan storage durations</li>
              <li>Configurable deletion policies</li>
              <li>Archival for evidentiary needs where permitted</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Your Rights</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Access, correction, and deletion where applicable</li>
              <li>Consent management</li>
              <li>Contact channels for privacy requests</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Cookies and Third Parties</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Operational cookies for authentication and session</li>
              <li>No unauthorized resale or sharing of personal data</li>
              <li>Third-party processors disclosed where used</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Security Measures</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Encryption in transit</li>
              <li>Access controls</li>
              <li>Monitoring and incident response</li>
            </ul>
          </ContentCard>
        </div>
      </PremiumPage>
    );
  }

  if (slug === "security") {
    return (
      <PremiumPage
        title="Security"
        description="Enterprise-grade security practices integrated across product, infrastructure, and operations."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Data Protection</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Encryption in transit</li>
              <li>Secure storage and isolation</li>
              <li>Backup and recovery procedures</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Access Controls</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Least-privilege access</li>
              <li>Role-based permissions</li>
              <li>Audit logging</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Monitoring and Response</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Continuous monitoring</li>
              <li>Incident response runbooks</li>
              <li>Post-incident reviews</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Compliance</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Controls mapped to industry frameworks</li>
              <li>Security testing and assessments</li>
              <li>Vendor risk management</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Responsible Disclosure</h2>
            <p className="mt-3 text-sm text-gray-300">
              Coordinated vulnerability disclosure with defined contact channels and remediation timelines.
            </p>
          </ContentCard>
        </div>
      </PremiumPage>
    );
  }

  if (slug === "help-center") {
    return (
      <PremiumPage
        title="Help Center"
        description="Centralized resources for account management, video uploads, results interpretation, and troubleshooting."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Getting Support</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Account, billing, and technical assistance</li>
              <li>Response targets based on plan tier</li>
              <li>Escalation paths for urgent issues</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Common Topics</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Video formats and upload errors</li>
              <li>Interpreting authenticity scores</li>
              <li>API authentication and rate limits</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Status and Incidents</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Service status updates</li>
              <li>Maintenance windows</li>
              <li>Incident postmortems</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Contact Channels</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Web form and email support</li>
              <li>Priority support for Pro and Enterprise</li>
              <li>Security reporting for vulnerabilities</li>
            </ul>
          </ContentCard>
        </div>
      </PremiumPage>
    );
  }

  if (slug === "tutorials") {
    return (
      <PremiumPage
        title="Tutorials"
        description="Step-by-step guides to integrate, upload, analyze, and interpret deepfake detection results."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Getting Started</h2>
            <ul className="mt-3 list-decimal pl-4 text-xs text-indigo-200/65">
              <li>Create an account and obtain credentials</li>
              <li>Upload your first video</li>
              <li>Read your first analysis report</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Web Upload</h2>
            <ul className="mt-3 list-decimal pl-4 text-xs text-indigo-200/65">
              <li>Prepare video files</li>
              <li>Monitor progress and status</li>
              <li>Interpret confidence scores</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">API Integration</h2>
            <ul className="mt-3 list-decimal pl-4 text-xs text-indigo-200/65">
              <li>Authenticate with bearer tokens</li>
              <li>Upload via endpoint</li>
              <li>Poll job status and read JSON results</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Best Practices</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Avoid transcoding-related artifacts</li>
              <li>Use consistent resolutions and frame rates</li>
              <li>Store and archive reports securely</li>
            </ul>
          </ContentCard>
        </div>
      </PremiumPage>
    );
  }

  if (slug === "faq") {
    return (
      <PremiumPage
        title="FAQ"
        description="Clear answers to common questions on technology, privacy, and usage."
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">General</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>What is deepfake detection and how does it work?</li>
              <li>Which formats are supported?</li>
              <li>How accurate are the results?</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Privacy</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>How are videos stored and secured?</li>
              <li>Can I delete my data?</li>
              <li>Do you share information with third parties?</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Technical</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>What are API rate limits?</li>
              <li>How do I interpret confidence scores?</li>
              <li>How to troubleshoot upload errors?</li>
            </ul>
          </ContentCard>
        </div>
      </PremiumPage>
    );
  }

  if (slug === "report-issue") {
    return (
      <PremiumPage
        title="Report Issue"
        description="Professional process for reporting product defects, outages, or security concerns."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Bug Reporting</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Describe expected vs actual behavior</li>
              <li>Include reproduction steps and environment</li>
              <li>Attach sample videos or logs where possible</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Outages and Degradation</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Provide timestamps and regions</li>
              <li>Include endpoints affected</li>
              <li>Share error codes and traces</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Security Disclosure</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Use responsible disclosure practices</li>
              <li>Provide technical details and potential impact</li>
              <li>Coordinate remediation timelines</li>
            </ul>
          </ContentCard>
          <ContentCard>
            <h2 className="text-xl font-semibold text-white">Response Targets</h2>
            <ul className="mt-3 list-disc pl-4 text-xs text-indigo-200/65">
              <li>Based on severity and plan tier</li>
              <li>Escalations available for Enterprise</li>
              <li>Status updates during investigation</li>
            </ul>
          </ContentCard>
        </div>
      </PremiumPage>
    );
  }

  return (
    <PremiumPage
      title={data.title}
      description={data.content}
    >
      <div className="text-center text-gray-400 p-8">
        Content coming soon...
      </div>
    </PremiumPage>
  );
}
