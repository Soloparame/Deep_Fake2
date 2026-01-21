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
    content: "RealEye uses advanced deep learning algorithms to analyze video frames for artifacts commonly found in deepfakes. Our multi-stage pipeline first extracts faces using MTCNN, then processes them through ensemble models including XceptionNet and EfficientNet. These models check for inconsistencies in lighting, facial movements, eye blinking patterns, and pixel-level details that are often invisible to the human eye but detectable by AI. The result is a comprehensive authenticity score that helps you verify media integrity.",
  },
  features: {
    title: "Features",
    content: "Our platform offers a comprehensive suite of detection tools. Key features include real-time video analysis, frame-by-frame deepfake probability scoring, and detailed forensic reports. We support multiple video formats (MP4, AVI, MOV) and offer an easy-to-use API for developers. Our dashboard provides historical data tracking, team collaboration tools, and exportable PDF reports for legal and compliance use cases.",
  },
  pricing: {
    title: "Pricing",
    content: "We offer flexible pricing plans designed to scale with your needs. Our 'Starter' plan is perfect for individuals and researchers, offering basic detection capabilities. The 'Pro' plan introduces batch processing and API access for small teams. For large organizations, our 'Enterprise' tier provides dedicated support, custom model fine-tuning, and unlimited API calls. Contact our sales team for a custom quote tailored to your volume requirements.",
  },
  "api-access": {
    title: "API Access",
    content: "Integrate RealEye's powerful detection engine directly into your applications with our RESTful API. We provide secure, token-based authentication and comprehensive endpoints for video upload, status polling, and result retrieval. Our API is designed for high throughput and low latency, making it suitable for social media platforms, news agencies, and content moderation pipelines. Check our developer portal for Swagger documentation and SDKs in Python and JavaScript.",
  },
  documentation: {
    title: "Documentation",
    content: "Welcome to the RealEye knowledge base. Here you will find detailed guides on how to use our web interface, integrate our API, and interpret detection results. We cover topics ranging from 'Getting Started' to advanced configuration for enterprise deployments. Our documentation also includes best practices for video preparation to ensure the highest detection accuracy.",
  },
  "about-us": {
    title: "About Us",
    content: "RealEye is a mission-driven company dedicated to combating the spread of misinformation and protecting digital authenticity. Founded by a team of AI researchers and cybersecurity experts, we are building the standard for deepfake detection. We believe in a world where digital content can be trusted, and we are working tirelessly to stay ahead of generative AI threats.",
  },
  research: {
    title: "Research",
    content: "Our R&D team is at the forefront of media forensics. We actively publish papers in top conferences like CVPR and ICCV. Our research focuses on generalizable deepfake detection, adversarial robustness, and multimodal analysis. On this page, you can access our whitepapers, technical reports, and datasets that we release to the academic community to foster collaboration.",
  },
  blog: {
    title: "Blog",
    content: "Stay updated with the latest trends in synthetic media and cybersecurity. Our blog features articles on emerging deepfake technologies, case studies of real-world deepfake incidents, and updates on our product roadmap. We also feature guest posts from industry leaders and tutorials on how to verify digital content.",
  },
  careers: {
    title: "Careers",
    content: "Join our mission to secure the digital world. We are looking for passionate individuals to join our engineering, research, and product teams. At RealEye, you will work on cutting-edge AI challenges and have a tangible impact on society. We offer competitive salaries, remote-first work culture, and the opportunity to work with some of the brightest minds in AI.",
  },
  contact: {
    title: "Contact",
    content: "We'd love to hear from you. Whether you have a question about our features, need technical support, or want to discuss a partnership, our team is here to help. You can reach us via email, phone, or by filling out the form below. For urgent security matters, please use our dedicated security contact channel.",
  },
  community: {
    title: "Community",
    content: "Join our vibrant community of developers, researchers, and digital safety advocates. We host a Discord server and a community forum where you can share ideas, ask questions, and collaborate on open-source projects related to media authenticity. We also organize hackathons and webinars to engage with the broader ecosystem.",
  },
  "terms-of-service": {
    title: "Terms of Service",
    content: "By using RealEye, you agree to our Terms of Service. These terms govern your use of our website, API, and services. They cover important topics such as user responsibilities, intellectual property rights, data usage, and liability limitations. We encourage you to read them carefully to understand your rights and obligations.",
  },
  "privacy-policy": {
    title: "Privacy Policy",
    content: "Your privacy is paramount to us. This policy outlines how we collect, use, and protect your personal data and the media content you upload. We adhere to strict data protection regulations (GDPR, CCPA) and employ industry-standard encryption for data at rest and in transit. We do not sell your data to third parties.",
  },
  security: {
    title: "Security",
    content: "Security is ingrained in our DNA. We employ a defense-in-depth approach to protect our infrastructure and your data. Our security measures include regular penetration testing, automated vulnerability scanning, and strict access controls. We also offer features like SSO (Single Sign-On) and audit logs for our enterprise customers.",
  },
  "help-center": {
    title: "Help Center",
    content: "Need assistance? Our Help Center is your first stop for answers. Browse through our categorized articles to find solutions to common issues, from account setup to troubleshooting API errors. If you can't find what you're looking for, you can easily submit a support ticket directly from this page.",
  },
  tutorials: {
    title: "Tutorials",
    content: "Master RealEye with our step-by-step tutorials. Whether you are a first-time user or an advanced developer, we have learning paths for you. Learn how to upload your first video, interpret the confidence heatmap, or build a custom integration using Webhooks. Our video and text-based tutorials make learning easy.",
  },
  faq: {
    title: "FAQ",
    content: "Find quick answers to the most frequently asked questions. We cover topics such as 'How accurate is the detection?', 'What video formats are supported?', 'Is there a free trial?', and 'How do I cancel my subscription?'. This section is regularly updated based on user feedback.",
  },
  "report-issue": {
    title: "Report Issue",
    content: "Found a bug or have a suggestion? We value your feedback. Use our issue reporting tool to describe the problem you encountered or the feature you'd like to see. Please provide as much detail as possible, including screenshots or reproduction steps, to help our engineering team address it quickly.",
  },
  "learn-more": {
    title: "Learn More",
    content: "Deepfakes are evolving rapidly, and so are we. In this section, we provide educational resources to help you understand the technology behind synthetic media. Learn about GANs (Generative Adversarial Networks), diffusion models, and the ethics of AI. Empower yourself with knowledge to navigate the digital landscape safely.",
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
