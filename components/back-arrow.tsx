"use client";

import { useRouter } from "next/navigation";

export function BackArrow() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="fixed top-5 left-4 md:top-5 md:left-6 z-50 w-11 h-11 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/25 backdrop-blur-md hover:bg-white/35 transition-all hover:scale-110 group shadow-[0_6px_20px_rgba(0,0,0,0.16)]"
      style={{
        boxShadow: "0 6px 22px rgba(0, 0, 0, 0.18), 0 2px 10px rgba(0, 0, 0, 0.12)"
      }}
      aria-label="Go back"
    >
      <svg
        className="w-6 h-6 md:w-7 md:h-7 text-white drop-shadow-md group-hover:drop-shadow-lg transition-all"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  );
}

