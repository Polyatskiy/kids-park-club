"use client";

import { useEffect } from "react";

export default function ColoringLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Add overflow hidden to html and body for coloring pages
    document.documentElement.classList.add("coloring-page-active");
    document.body.classList.add("coloring-page-active");

    return () => {
      // Cleanup when leaving the page
      document.documentElement.classList.remove("coloring-page-active");
      document.body.classList.remove("coloring-page-active");
    };
  }, []);

  return <>{children}</>;
}

