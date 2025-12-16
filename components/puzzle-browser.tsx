"use client";

import { Link } from "@/i18n/routing";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { getItems, getCategories } from "@/lib/content-repository";
import { JIGSAW_OPTIONS } from "@/app/[locale]/games/jigsaw/jigsawConfig";
import { CarouselRow } from "@/components/carousel-row";
import { useState, useEffect } from "react";
import type { Item, Category, Subcategory } from "@/types/content";

interface PuzzleBrowserProps {
  initialItems?: Item[];
  initialCategories?: Category[];
  initialSubcategories?: Subcategory[];
}

export default function PuzzleBrowser({ 
  initialItems,
  initialCategories,
  initialSubcategories = []
}: PuzzleBrowserProps = {}) {
  const [items, setItems] = useState<Item[]>(initialItems || []);
  const [categories, setCategories] = useState<Category[]>(initialCategories || []);
  const [loading, setLoading] = useState(!initialItems);
  const t = useTranslations("common");
  const locale = useLocale();

  useEffect(() => {
    if (initialItems && initialCategories) {
      return; // Use server-provided data
    }

    async function load() {
      try {
        const [itemsData, categoriesData] = await Promise.all([
          getItems('puzzles', { locale }),
          getCategories('puzzles', locale),
        ]);
        setItems(itemsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Failed to load puzzle items:", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [locale, initialItems, initialCategories]);

  if (loading) {
    return <div className="p-4 text-center text-gray-500">{t("loading")}</div>;
  }

  if (items.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        {t("noPuzzles")}
      </div>
    );
  }

  // Group items by category
  const itemsByCategory = new Map<string, Item[]>();
  items.forEach((item) => {
    const catId = item.categoryId;
    if (!itemsByCategory.has(catId)) {
      itemsByCategory.set(catId, []);
    }
    itemsByCategory.get(catId)!.push(item);
  });

  // Get category details
  const categoryMap = new Map(categories.map(cat => [cat.id, cat]));

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="sr-only">{t("puzzlesPage.title") || "Jigsaw Puzzles for Kids"}</h1>
      {Array.from(itemsByCategory.entries()).map(([categoryId, categoryItems]) => {
        const category = categoryMap.get(categoryId);
        if (!category) return null;

        // Group by subcategory
        const itemsBySubcategory = new Map<string, Item[]>();
        categoryItems.forEach((item) => {
          const subId = item.subcategoryId || 'uncategorized';
          if (!itemsBySubcategory.has(subId)) {
            itemsBySubcategory.set(subId, []);
          }
          itemsBySubcategory.get(subId)!.push(item);
        });

        return (
          <CategoryBlock
            key={categoryId}
            category={category}
            itemsBySubcategory={itemsBySubcategory}
            allSubcategories={initialSubcategories}
          />
        );
      })}
    </div>
  );
}

function CategoryBlock({
  category,
  itemsBySubcategory,
  allSubcategories,
}: {
  category: Category;
  itemsBySubcategory: Map<string, Item[]>;
  allSubcategories?: Subcategory[];
}) {
  // Use provided subcategories or empty map
  const subcategoryMap = new Map<string, Subcategory>();
  if (allSubcategories) {
    allSubcategories.forEach(sub => {
      if (sub.categoryId === category.id) {
        subcategoryMap.set(sub.id, sub);
      }
    });
  }

  return (
    <div className="mb-10">
      <h2 className="inline-block text-2xl font-bold mb-4 px-3 py-1 rounded-xl bg-white/35 backdrop-blur-[12px] text-[#222] shadow-[0_2px_8px_rgba(0,0,0,0.18)]">
        {category.title}
      </h2>
      {category.description && (
        <p className="text-gray-700 mb-4 px-3 text-sm md:text-base">{category.description}</p>
      )}

      {Array.from(itemsBySubcategory.entries()).map(([subcategoryId, items]) => {
        const subcategory = subcategoryMap.get(subcategoryId);
        const subcategoryTitle = subcategory?.title || "Uncategorized";

        return (
          <SubcategoryBlock
            key={subcategoryId}
            title={subcategoryTitle}
            items={items}
          />
        );
      })}
    </div>
  );
}

function SubcategoryBlock({
  title,
  items,
}: {
  title: string;
  items: Item[];
}) {
  const carouselItems = items.map((item) => (
    <PuzzleCard key={item.id} item={item} />
  ));

  return <CarouselRow title={title} items={carouselItems} />;
}

function PuzzleCard({ item }: { item: Item }) {
  return (
    <article className="rounded-2xl bg-white/20 backdrop-blur-md shadow-[0_10px_28px_rgba(0,0,0,0.14)] overflow-hidden flex flex-col border border-white/30">
      <div className="aspect-[4/3] relative bg-white/30">
        {item.thumbUrl ? (
          <Image
            src={item.thumbUrl}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-100">
            No image
          </div>
        )}
      </div>

      <div className="p-3 md:p-4 flex flex-col gap-2 md:gap-3">
        <h2
          className="text-base font-semibold text-white"
          style={{ textShadow: "0 2px 6px rgba(0,0,0,0.25)" }}
        >
          {item.title}
        </h2>

        <div className="grid grid-cols-3 gap-1.5 md:flex md:flex-wrap md:gap-2">
          {JIGSAW_OPTIONS.map((opt) => {
            // Dynamic font size based on digit count
            const fontSize = opt.pieces >= 100 ? 12 : opt.pieces >= 10 ? 14 : 16;
            return (
              <Link
                key={opt.pieces}
                href={`/games/jigsaw?imageId=${item.id}&size=${opt.pieces}`}
                className="relative transition-transform hover:scale-110 w-full aspect-square md:w-11 md:h-11"
              >
                {/* Puzzle icon as background */}
                <Image
                  src="/icons/puzzle.png"
                  alt={`${opt.pieces} pieces`}
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
