"use client";

import Link from "next/link";
import Image from "next/image";
import logo from "@/public/images/logo.svg";

export default function Logo() {
  const imgClass = "animate-[spin_8s_linear_infinite]";

  return (
    <Link href="/" className="inline-flex shrink-0" aria-label="RealEye">
      <Image
        src={logo}
        alt="RealEye Logo"
        width={32}
        height={32}
        className={imgClass}
      />
    </Link>
  );
}
