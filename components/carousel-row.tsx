"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

interface CarouselRowProps {
  title: string;
  items: React.ReactNode[];
  className?: string;
}

export function CarouselRow({ title, items, className = "" }: CarouselRowProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: false,
      align: "start",
      slidesToScroll: 1,
      breakpoints: {
        "(min-width: 640px)": { slidesToScroll: 2 },
        "(min-width: 1024px)": { slidesToScroll: 3 },
      },
      dragFree: false,
      containScroll: "trimSnaps",
    },
    [
      Autoplay({
        delay: 3000,
        stopOnInteraction: true,
        stopOnMouseEnter: false,
        stopOnFocusIn: false,
        stopOnLastSnap: false,
      }),
    ]
  );

  const [autoplayActive, setAutoplayActive] = useState(true);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const autoplayStoppedRef = useRef(false);

  // Function to stop autoplay permanently
  const stopAutoplay = useCallback(() => {
    if (!emblaApi || autoplayStoppedRef.current) return;
    
    autoplayStoppedRef.current = true;
    setAutoplayActive(false);
    
    // Get autoplay plugin and stop it
    const plugins = emblaApi.plugins();
    if (plugins && plugins.autoplay) {
      const autoplay = plugins.autoplay;
      if (autoplay && typeof autoplay.stop === 'function') {
        autoplay.stop();
      }
    }
  }, [emblaApi]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) {
      // Stop autoplay immediately and synchronously before scrolling
      stopAutoplay();
      emblaApi.scrollPrev();
    }
  }, [emblaApi, stopAutoplay]);

  const scrollNext = useCallback(() => {
    if (emblaApi) {
      // Stop autoplay immediately and synchronously before scrolling
      stopAutoplay();
      emblaApi.scrollNext();
    }
  }, [emblaApi, stopAutoplay]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    // Stop autoplay on any scroll event (including programmatic scrolling from arrows)
    const handleScroll = () => {
      if (!autoplayStoppedRef.current) {
        stopAutoplay();
      }
    };

    // Disable autoplay on any user interaction
    const handleInteraction = () => {
      if (!autoplayStoppedRef.current) {
        stopAutoplay();
      }
    };

    // Listen to scroll and settle events (catches arrow clicks and programmatic scrolling)
    emblaApi.on("scroll", handleScroll);
    emblaApi.on("settle", handleScroll);
    
    // Listen to various interaction events (catches drag/swipe)
    emblaApi.on("pointerDown", handleInteraction);
    emblaApi.on("touchStart", handleInteraction);
    emblaApi.on("dragStart", handleInteraction);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
      emblaApi.off("scroll", handleScroll);
      emblaApi.off("settle", handleScroll);
      emblaApi.off("pointerDown", handleInteraction);
      emblaApi.off("touchStart", handleInteraction);
      emblaApi.off("dragStart", handleInteraction);
    };
  }, [emblaApi, onSelect, autoplayActive, stopAutoplay]);

  if (items.length === 0) return null;

  return (
    <div className={`mb-6 ${className}`}>
      {/* Subcategory Title */}
      <h3 className="inline-block text-xl font-semibold mb-3 px-3 py-1 rounded-lg bg-white/30 backdrop-blur-[10px] text-[#222] shadow-[0_2px_6px_rgba(0,0,0,0.15)]">
        {title}
      </h3>

      {/* Carousel Container */}
      <div className="relative group">
        {/* Navigation Arrows - Show on hover for desktop, always visible on mobile */}
        {canScrollPrev && (
          <button
            onClick={scrollPrev}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-all flex items-center justify-center hover:scale-110 active:scale-95 opacity-100 md:opacity-0 md:group-hover:opacity-100"
            aria-label="Previous"
          >
            <svg
              className="w-5 h-5 md:w-6 md:h-6 text-gray-800"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}

        {canScrollNext && (
          <button
            onClick={scrollNext}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-all flex items-center justify-center hover:scale-110 active:scale-95 opacity-100 md:opacity-0 md:group-hover:opacity-100"
            aria-label="Next"
          >
            <svg
              className="w-5 h-5 md:w-6 md:h-6 text-gray-800"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}

        {/* Embla Carousel */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex-[0_0_auto] min-w-0 carousel-slide"
              >
                <div className="w-full">{item}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
