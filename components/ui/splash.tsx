"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import logo from "@/public/images/logo.svg";

export default function Splash() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShow(false), 4000);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f5f4fb]">
      <Image
        src={logo}
        alt="Multi-modal AI Integrity Suite Logo"
        width={64}
        height={64}
        className="animate-[spin_8s_linear_infinite] drop-shadow-[0_8px_30px_rgba(99,102,241,0.35)]"
        priority
      />
    </div>
  );
}
