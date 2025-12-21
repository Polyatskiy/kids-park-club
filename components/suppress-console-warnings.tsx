"use client";

import { useEffect } from "react";

/**
 * Suppress non-critical console warnings from third-party scripts
 * (like Vercel Live Feedback) that we cannot control
 */
export function SuppressConsoleWarnings() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Store original console.warn
    const originalWarn = console.warn;

    // Override console.warn to filter out known non-critical warnings
    console.warn = (...args: any[]) => {
      const message = args[0]?.toString() || "";

      // Filter out deprecated zustand warnings from Vercel Live Feedback
      // These are from external scripts we cannot control
      if (
        message.includes("[DEPRECATED] Default export is deprecated") &&
        message.includes("zustand")
      ) {
        // Suppress this specific warning - it's from Vercel Live Feedback
        return;
      }

      // Allow all other warnings through
      originalWarn.apply(console, args);
    };

    // Cleanup: restore original console.warn on unmount
    return () => {
      console.warn = originalWarn;
    };
  }, []);

  return null;
}

