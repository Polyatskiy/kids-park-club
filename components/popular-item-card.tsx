"use client";

import { Link } from "@/i18n/routing";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { Item } from "@/types/content";
import { JIGSAW_OPTIONS } from "@/app/[locale]/games/jigsaw/jigsawConfig";

interface PopularItemCardProps {
  item: Item;
}

export function PopularItemCard({ item }: PopularItemCardProps) {
  const t = useTranslations("common.pages");
  
  // For puzzles, create link to jigsaw game
  if (item.type === "puzzles") {
    const defaultOption =
      JIGSAW_OPTIONS.find((o) => o.pieces === 25) ?? JIGSAW_OPTIONS[Math.floor(JIGSAW_OPTIONS.length / 2)];
    const href = `/games/jigsaw?imageId=${item.id}&size=${defaultOption?.pieces ?? 25}`;

    return (
      <Link
        href={href}
        className="block rounded-2xl overflow-hidden border border-white/30 bg-white/20 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.2)] transition-shadow"
      >
        <div className="w-full relative aspect-[5/4] bg-white/30 flex items-center justify-center overflow-hidden">
          {item.thumbUrl ? (
            <Image
              src={item.thumbUrl}
              alt={item.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 33vw"
              loading="lazy"
              fetchPriority="auto"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
              No image
            </div>
          )}
        </div>
        <div className="p-3">
          <div className="font-semibold text-slate-800 text-sm md:text-base">
            {item.title}
          </div>
          <div className="text-xs mt-1 text-slate-700">
            {t("puzzle")}
          </div>
        </div>
      </Link>
    );
  }

  // For coloring pages
  const href = `/coloring/${item.slug || item.id}`;
  
  return (
    <Link
      href={href}
      className="block rounded-2xl overflow-hidden border border-white/30 bg-white/20 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.2)] transition-shadow"
    >
      <div className="w-full relative aspect-[5/4] bg-white/30 flex items-center justify-center overflow-hidden">
        {item.thumbUrl ? (
          <Image
            src={item.thumbUrl}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
            No image
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="font-semibold text-slate-800 text-sm md:text-base">
          {item.title}
        </div>
        <div className="text-xs mt-1 text-slate-700">
          {t("coloring")}
        </div>
      </div>
    </Link>
  );
}

