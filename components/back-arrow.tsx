"use client";

import { useRouter } from "next/navigation";

export function BackArrow() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="fixed top-4 left-4 md:top-5 md:left-6 z-50 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all hover:scale-110 group"
      style={{
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)"
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

