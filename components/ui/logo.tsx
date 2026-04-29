"use client";

import Link from "next/link";
import Image from "next/image";
import logo from "@/public/images/logo.svg";

export default function Logo() {
  return (
    <Link href="/" className="inline-flex shrink-0 items-center gap-2" aria-label="RealEye">
      <Image
        src={logo}
        alt="RealEye Logo"
        width={32}
        height={32}
        className="h-8 w-8"
      />
      <span className="hidden bg-gradient-to-r from-slate-900 to-indigo-600 bg-clip-text text-sm font-semibold text-transparent sm:inline">
        RealEye
      </span>
    </Link>
  );
}
