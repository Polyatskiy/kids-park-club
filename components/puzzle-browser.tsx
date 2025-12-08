"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { JIGSAW_DIFFICULTIES } from "@/app/games/jigsaw/jigsawConfig";
import type { PuzzleImage } from "@/types/content";

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
      <h2 className="text-2xl font-bold mb-4">{title}</h2>

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
  return (
    <div className="mb-6">
      <h3 className="text-xl font-semibold mb-3">{title}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <PuzzleCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function PuzzleCard({ item }: { item: PuzzleItem }) {
  return (
    <article className="rounded-xl bg-white shadow-md overflow-hidden flex flex-col border border-gray-100">
      <div className="aspect-[4/3] relative bg-gray-100">
        {item.thumbnail_url ? (
          <Image
            src={item.thumbnail_url}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            Нет изображения
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-3">
        <h2 className="text-base font-semibold text-gray-900">
          {item.title}
        </h2>

        <div className="flex flex-wrap gap-2">
          {JIGSAW_DIFFICULTIES.map((d) => (
            <Link
              key={d.gridSize}
              href={`/games/jigsaw?imageId=${item.id}&size=${d.gridSize}`}
              className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium bg-gray-50 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
            >
              {d.label}
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}

