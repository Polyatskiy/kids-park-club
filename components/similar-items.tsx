"use client";

import { Link } from "@/i18n/routing";
import Image from "next/image";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import type { Item } from "@/types/content";

interface SimilarItemsProps {
  items: Item[];
  type: "coloring" | "puzzles";
  currentItemId: string;
  locale: string;
}

export function SimilarItems({ items, type, currentItemId, locale }: SimilarItemsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("common.similarItems");
  
  // Filter out current item and limit to 12 для лучшего скролла
  const similarItems = items
    .filter(item => item.id !== currentItemId)
    .slice(0, 12);

  if (similarItems.length === 0) {
    return null;
  }

  const basePath = type === "coloring" ? "/coloring" : "/games/jigsaw";
  const getItemUrl = (item: Item) => {
    if (type === "coloring") {
      return `${basePath}/${item.slug || item.id}`;
    } else {
      return `${basePath}?imageId=${item.id}`;
    }
  };

  // Горизонтальный скролл колесиком мыши
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    // Если есть вертикальная прокрутка, конвертируем её в горизонтальную
    const hasVerticalScroll = Math.abs(e.deltaY) > Math.abs(e.deltaX);
    if (hasVerticalScroll && (container.scrollWidth > container.clientWidth)) {
      e.preventDefault();
      e.stopPropagation();
      container.scrollBy({
        left: e.deltaY,
        behavior: 'auto'
      });
    }
  };

  return (
    <div className="mt-2 p-2 md:p-3 bg-white/50 backdrop-blur-sm rounded-lg border border-white/30 shadow-soft">
      <h2 className="text-xs md:text-sm font-bold mb-1.5 md:mb-2 text-slate-900">
        {type === "coloring" ? t("coloringPages") : t("puzzles")}
      </h2>
      {/* Горизонтальный скролл с маленькими карточками */}
      <div 
        ref={scrollContainerRef}
        className="similar-items-scroll overflow-x-auto overflow-y-hidden -mx-2 md:-mx-3 px-2 md:px-3"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 #f1f5f9',
          WebkitOverflowScrolling: 'touch', // Плавный скролл на мобильных
        }}
        onWheel={handleWheel}
      >
        <div className="flex gap-1.5 md:gap-2 pb-3">
          {similarItems.map((item) => (
            <Link
              key={item.id}
              href={getItemUrl(item)}
              className="flex-shrink-0 block p-1 rounded-md border border-white/30 bg-white/20 backdrop-blur-md hover:shadow-[0_6px_16px_rgba(0,0,0,0.1)] transition-shadow shadow-[0_3px_8px_rgba(0,0,0,0.06)] w-16 md:w-24"
            >
              <div className="w-full relative aspect-[5/4] rounded overflow-hidden bg-white/30 mb-1">
                <Image
                  src={item.thumbUrl || item.sourceUrl || "/placeholder.png"}
                  alt={item.title}
                  fill
                  className="object-cover"
                  sizes="96px"
                  loading="lazy"
                />
              </div>
              <div className="text-center text-[8px] md:text-[9px] font-medium text-slate-800 line-clamp-2 leading-tight min-h-[2em]">
                {item.title}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

