"use client";

import { useState, useEffect } from "react";

interface MoreCardProps {
  onClick: () => void;
  isExpanded?: boolean;
  className?: string;
}

export function MoreCard({ onClick, isExpanded = false, className = "" }: MoreCardProps) {
  const [shouldBounce, setShouldBounce] = useState(false);

  useEffect(() => {
    if (isExpanded) {
      setShouldBounce(false);
      return;
    }

    // Bounce animation every 2-3 seconds
    const interval = setInterval(() => {
      setShouldBounce(true);
      // Reset after animation completes (bounce animation is ~600ms)
      setTimeout(() => setShouldBounce(false), 600);
    }, 2500);

    // Start first bounce after a short delay
    const timeout = setTimeout(() => {
      setShouldBounce(true);
      setTimeout(() => setShouldBounce(false), 600);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isExpanded]);

  return (
    <button
      onClick={onClick}
      className={`block p-2 rounded-2xl border border-white/30 bg-white/20 backdrop-blur-md hover:shadow-[0_12px_30px_rgba(0,0,0,0.16)] transition-all shadow-[0_10px_24px_rgba(0,0,0,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
      aria-label="Show more"
    >
      <div className="w-full relative aspect-[5/4] rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col items-center justify-center gap-2">
        {/* Plus icon in circle */}
        <div className="relative w-12 h-12 md:w-16 md:h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-blue-500/20 backdrop-blur-sm"></div>
          <svg
            className="relative w-8 h-8 md:w-10 md:h-10 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </div>

        {/* Chevron icon with bounce animation (chevron-down for all devices) */}
        <svg
          className={`w-5 h-5 text-blue-600 transition-transform duration-300 ${
            shouldBounce && !isExpanded ? 'animate-bounce' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>

        {/* Optional text */}
        <span className="text-xs md:text-sm font-semibold text-blue-700 mt-1">
          Ещё
        </span>
      </div>
    </button>
  );
}

