import "./css/style.css";

import { Inter } from "next/font/google";
import localFont from "next/font/local";

import Header from "@/components/ui/header";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const nacelle = localFont({
  src: [
    {
      path: "../public/fonts/nacelle-regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/nacelle-italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/nacelle-semibold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/nacelle-semibolditalic.woff2",
      weight: "600",
      style: "italic",
    },
  ],
  variable: "--font-nacelle",
  display: "swap",
});

export const metadata = {
  title: "RealEye - Deepfake, Image AI, and Project Intel",
  description:
    "Unified platform for deepfake video detection, AI image checks, and Project Intel analysis with similarity, competitor search, and strategic insights.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${nacelle.variable} bg-[#f5f4fb] font-inter text-base text-slate-800 antialiased selection:bg-indigo-200/70`}
      >
        {/* Global Background Effects */}
        <div className="fixed inset-0 -z-10 h-full w-full bg-[#f5f4fb]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366f10f_1px,transparent_1px),linear-gradient(to_bottom,#6366f10f_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[340px] w-[340px] rounded-full bg-indigo-300/35 blur-[110px]"></div>
          <div className="absolute bottom-0 right-[-8%] -z-10 h-[420px] w-[420px] rounded-full bg-violet-300/30 blur-[120px]"></div>
          <div className="absolute right-0 top-0 -z-10 h-full w-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(167,139,250,0.25),rgba(255,255,255,0))]"></div>
        </div>

        <div className="flex min-h-screen flex-col overflow-hidden supports-[overflow:clip]:overflow-clip">
          <Header />
          <main className="grow pt-24">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
