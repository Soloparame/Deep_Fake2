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

  return (
    <section className="relative">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="pt-32 pb-12 md:pt-40 md:pb-20">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="h1 mb-4" data-aos="fade-up">
              {data.title}
            </h1>
            <p
              className="text-xl text-gray-400"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              {data.content}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
