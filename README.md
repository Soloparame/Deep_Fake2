# RealEye - AI-Powered Deepfake Detection System

**RealEye** is an advanced AI-based system for detecting deepfakes and synthetic videos. Built with Next.js, React, and state-of-the-art deep learning models, RealEye helps you verify video authenticity and protect yourself from misinformation.

## 🎯 Project Overview

RealEye addresses the growing threat of AI-generated deepfake content by providing:
- **Automated Detection**: AI-powered analysis of video authenticity
- **High Accuracy**: State-of-the-art deep learning models (XceptionNet, EfficientNet)
- **Face Analysis**: Advanced facial feature extraction and manipulation detection
- **Real-time Processing**: Fast and efficient video analysis
- **Privacy First**: Secure processing with immediate file deletion

## 🚀 Features

- 🔍 **Advanced Face Detection**: Using MTCNN and Dlib for facial region extraction
- 🎬 **Frame Extraction**: Automated processing with OpenCV and FFmpeg
- 🤖 **Deep Learning Models**: XceptionNet and EfficientNet for classification
- 📊 **Detailed Reports**: Confidence scores and verification status
- 🔒 **Privacy Focused**: Secure processing with immediate file deletion
- ⚡ **Fast Processing**: Optimized algorithms for quick results

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Headless UI
- **Animations**: AOS (Animate On Scroll)

## 📋 Prerequisites

- Node.js 18+ or higher
- npm, pnpm, or yarn package manager

## 🏃 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
realeye/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── (default)/         # Main application pages
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # UI components (header, footer, etc.)
│   ├── features.tsx      # Features section
│   ├── workflows.tsx     # How it works section
│   └── ...
├── public/               # Static assets
└── utils/               # Utility functions
```

## 🎨 Customization

### Updating Branding

- Edit `components/ui/logo.tsx` to change the logo
- Update metadata in `app/layout.tsx` and `app/(default)/page.tsx`
- Modify colors and styling in Tailwind CSS classes

### Adding New Sections

Create new component files in the `components/` directory and import them in your pages.

## 🔐 Environment Setup

Create a `.env.local` file for environment variables (when you add backend integration):

```env
API_URL=your_api_url_here
```

## 📝 License

This project is licensed under the GPL License. Copyright 2024 RealEye.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Contact

For questions or support, please visit our [website](#) or contact us at support@realeye.ai

---

**RealEye** - Protecting digital authenticity with AI-powered deepfake detection.
