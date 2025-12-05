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

    // Check if mobile and hide navbar
    const checkMobile = () => {
      const isMobile = window.innerWidth < 900;
      if (isMobile) {
        document.body.classList.add("coloring-mobile-fullscreen");
      } else {
        document.body.classList.remove("coloring-mobile-fullscreen");
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      // Cleanup when leaving the page
      document.documentElement.classList.remove("coloring-page-active");
      document.body.classList.remove("coloring-page-active");
      document.body.classList.remove("coloring-mobile-fullscreen");
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  return <>{children}</>;
}

