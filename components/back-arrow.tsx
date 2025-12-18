"use client";

import { useRouter } from "next/navigation";

export function BackArrow() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="fixed top-3 left-3 md:top-4 md:left-5 z-50 w-11 h-11 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-surface shadow-soft border border-border hover:bg-surface-muted hover:shadow-strong transition-transform transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95"
      aria-label="Go back"
    >
      <svg
        className="w-5 h-5 md:w-6 md:h-6 text-slate-800"
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

