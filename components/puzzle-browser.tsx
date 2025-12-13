"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { JIGSAW_OPTIONS } from "@/app/games/jigsaw/jigsawConfig";
import type { PuzzleImage } from "@/types/content";
import { CarouselRow } from "@/components/carousel-row";

type PuzzleItem = {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  slug: string;
  image_url: string;
  thumbnail_url: string | null;
};

// Server-fetched puzzle type (from content-repository)
type ServerPuzzle = PuzzleImage;

interface PuzzleBrowserProps {
  /** Puzzles pre-fetched on the server (bypasses RLS) */
  serverPuzzles?: ServerPuzzle[];
}

export default function PuzzleBrowser({ serverPuzzles }: PuzzleBrowserProps) {
  // Convert server puzzles to the format we use internally
  const convertedServerPuzzles: PuzzleItem[] = (serverPuzzles || []).map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    subcategory: p.subCategory || "",
    slug: p.slug,
    image_url: p.imageUrl,
    thumbnail_url: p.thumbnailUrl || null,
  }));

  const [items, setItems] = useState<PuzzleItem[]>(convertedServerPuzzles);
  const [loading, setLoading] = useState(!serverPuzzles || serverPuzzles.length === 0);

  const supabase = supabaseBrowser();

  useEffect(() => {
    // If we have server-provided puzzles, don't fetch again
    if (serverPuzzles && serverPuzzles.length > 0) {
      setLoading(false);
      return;
    }

    // Fallback: try to fetch on client (may fail due to RLS)
    async function load() {
      const { data, error } = await supabase
        .from("puzzle_items")
        .select("*")
        .order("created_at", { ascending: false });

      // DEBUG: Log the result to understand what's happening
      if (process.env.NODE_ENV !== "production") {
        console.log("[DEBUG] puzzle_items client query result:", { 
          data, 
          error,
          dataLength: data?.length,
          errorMessage: error?.message,
          errorCode: error?.code
        });
      }

      if (error) {
        console.error("[DEBUG] Supabase error fetching puzzles (likely RLS issue):", error);
      }

      if (!error && data) {
        // Convert Supabase response to our format (id is number from DB, convert to string)
        const converted = data.map((row: any) => ({
          id: String(row.id),
          title: row.title,
          category: row.category,
          subcategory: row.subcategory,
          slug: row.slug,
          image_url: row.image_url,
          thumbnail_url: row.thumbnail_url,
        }));
        setItems(converted);
      }

      setLoading(false);
    }

    load();
  }, [serverPuzzles]);

  if (loading)
    return <div className="p-4 text-center text-gray-500">Загрузка...</div>;

  if (items.length === 0)
    return (
      <div className="p-6 text-center text-gray-500">
        Пока нет пазлов. Добавьте первый в админ-панели!
      </div>
    );

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Группируем по категориям */}
      {Array.from(new Set(items.map((i) => i.category))).map((category) => (
        <CategoryBlock
          key={category}
          title={category}
          items={items.filter((i) => i.category === category)}
        />
      ))}
    </div>
  );
}

function CategoryBlock({
  title,
  items,
}: {
  title: string;
  items: PuzzleItem[];
}) {
  const subcats = Array.from(new Set(items.map((i) => i.subcategory)));

  return (
    <div className="mb-10">
      <h2 className="inline-block text-2xl font-bold mb-4 px-3 py-1 rounded-xl bg-white/35 backdrop-blur-[12px] text-[#222] shadow-[0_2px_8px_rgba(0,0,0,0.18)]">
        {title}
      </h2>

      {subcats.map((sub) => (
        <SubcategoryBlock
          key={sub}
          title={sub}
          items={items.filter((i) => i.subcategory === sub)}
        />
      ))}
    </div>
  );
}

function SubcategoryBlock({
  title,
  items,
}: {
  title: string;
  items: PuzzleItem[];
}) {
  const carouselItems = items.map((item) => (
    <PuzzleCard key={item.id} item={item} />
  ));

  return <CarouselRow title={title} items={carouselItems} />;
}

function PuzzleCard({ item }: { item: PuzzleItem }) {
  return (
    <article className="rounded-2xl bg-white/20 backdrop-blur-md shadow-[0_10px_28px_rgba(0,0,0,0.14)] overflow-hidden flex flex-col border border-white/30">
      <div className="aspect-[4/3] relative bg-white/30">
        {item.thumbnail_url ? (
          <Image
            src={item.thumbnail_url}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-100">
            Нет изображения
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-3">
        <h2
          className="text-base font-semibold text-white"
          style={{ textShadow: "0 2px 6px rgba(0,0,0,0.25)" }}
        >
          {item.title}
        </h2>

        <div className="flex flex-wrap gap-2">
          {JIGSAW_OPTIONS.map((opt) => {
            // Dynamic font size based on digit count
            const fontSize = opt.pieces >= 100 ? 12 : opt.pieces >= 10 ? 14 : 16;
            return (
              <Link
                key={opt.pieces}
                href={`/games/jigsaw?imageId=${item.id}&size=${opt.pieces}`}
                className="relative transition-transform hover:scale-110"
                style={{ width: 44, height: 44 }}
              >
                {/* Puzzle icon as background */}
                <Image
                  src="/icons/puzzle.png"
                  alt={`${opt.pieces} пазлов`}
                  fill
                  className="object-contain drop-shadow-md"
                />
                {/* Number overlay centered on icon */}
                <span
                  className="absolute inset-0 flex items-center justify-center font-extrabold"
                  style={{
                    fontSize: fontSize,
                    color: '#1E3A8A',
                    textShadow: '0 1px 2px rgba(255,255,255,0.4)',
                    letterSpacing: '-0.5px',
                  }}
                >
                  {opt.pieces}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </article>
  );
}

