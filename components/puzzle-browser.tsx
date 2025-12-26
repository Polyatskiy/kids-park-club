"use client";

import { Link } from "@/i18n/routing";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { getItems, getCategories } from "@/lib/content-repository";
import { JIGSAW_OPTIONS } from "@/app/[locale]/games/jigsaw/jigsawConfig";
import { MoreCard } from "@/components/more-card";
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
      {Array.from(itemsByCategory.entries()).map(([categoryId, categoryItems], categoryIndex) => {
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
            isFirstCategory={categoryIndex === 0}
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
  isFirstCategory = false,
}: {
  category: Category;
  itemsBySubcategory: Map<string, Item[]>;
  allSubcategories?: Subcategory[];
  isFirstCategory?: boolean;
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

      {Array.from(itemsBySubcategory.entries()).map(([subcategoryId, items], subcategoryIndex) => {
        const subcategory = subcategoryMap.get(subcategoryId);
        const subcategoryTitle = subcategory?.title || "Uncategorized";
        // Mark first subcategory of first category as priority for LCP optimization
        const isFirstSubcategory = subcategoryIndex === 0;

        return (
          <SubcategoryBlock
            key={subcategoryId}
            title={subcategoryTitle}
            items={items}
            isFirst={isFirstCategory && isFirstSubcategory}
          />
        );
      })}
    </div>
  );
}

function SubcategoryBlock({
  title,
  items,
  isFirst = false,
}: {
  title: string;
  items: Item[];
  isFirst?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Desktop: show 7 items + "More" card (if > 7) in 4 columns × 2 rows grid
  // Mobile: show 3 items + "More" card (if > 3) in 2 columns × 2 rows grid
  const desktopLimit = 7;
  const mobileLimit = 3;
  const hasMoreDesktop = items.length > desktopLimit;
  const hasMoreMobile = items.length > mobileLimit;

  const handleMoreClick = () => {
    setIsExpanded(true);
  };

  // Calculate visible items based on expansion state
  // Mobile: show first 3 items + More card (if > 3)
  // Desktop: show first 7 items + More card (if > 7)
  // When expanded, show all items in the main grid
  const visibleItemsMobile = isExpanded ? items : items.slice(0, mobileLimit);
  const visibleItemsDesktop = isExpanded ? items : items.slice(0, desktopLimit);

  const showMoreCardMobile = !isExpanded && hasMoreMobile;
  const showMoreCardDesktop = !isExpanded && hasMoreDesktop;

  return (
    <div className="mb-6">
      {/* Subcategory Title */}
      <h3 className="inline-block text-xl font-semibold mb-3 px-3 py-1 rounded-lg bg-white/30 backdrop-blur-[10px] text-[#222] shadow-[0_2px_6px_rgba(0,0,0,0.15)]">
        {title}
      </h3>

      {/* Grid Container - Mobile: 2 columns, Desktop: 4 columns */}
      <div className="px-4 md:px-0">
        {/* Mobile grid: 2 columns × 2 rows (3 items + More card) */}
        <div className="grid grid-cols-2 gap-4 md:hidden">
          {visibleItemsMobile.map((item, index) => (
            <PuzzleCard 
              key={item.id} 
              item={item} 
              priority={isFirst && index === 0} 
            />
          ))}
          {showMoreCardMobile && (
            <MoreCard 
              onClick={handleMoreClick} 
              isExpanded={isExpanded}
            />
          )}
        </div>

        {/* Desktop grid: 4 columns × 2 rows (7 items + More card) */}
        <div className="hidden md:grid md:grid-cols-4 gap-4">
          {visibleItemsDesktop.map((item, index) => (
            <PuzzleCard 
              key={item.id} 
              item={item} 
              priority={isFirst && index === 0} 
            />
          ))}
          {showMoreCardDesktop && (
            <MoreCard 
              onClick={handleMoreClick} 
              isExpanded={isExpanded}
            />
          )}
        </div>

      </div>
    </div>
  );
}

function PuzzleCard({ item, priority = false }: { item: Item; priority?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  const minPieces = JIGSAW_OPTIONS[0]?.pieces ?? 9;
  const maxPieces = JIGSAW_OPTIONS[JIGSAW_OPTIONS.length - 1]?.pieces ?? minPieces;
  const defaultOption =
    JIGSAW_OPTIONS.find((o) => o.pieces === 25) ?? JIGSAW_OPTIONS[Math.floor(JIGSAW_OPTIONS.length / 2)];
  const defaultHref = `/games/jigsaw?imageId=${item.id}&size=${defaultOption?.pieces ?? minPieces}`;

  const toggleOpen = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  return (
    <article
      className="relative rounded-2xl bg-card border border-border shadow-soft overflow-hidden group focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-transparent w-[110%] md:w-full transition-all duration-300"
      onMouseLeave={closeMenu}
    >
      <div className="relative aspect-[25/24] md:aspect-[25/24] md:group-hover:aspect-[125/144] bg-surface-muted transition-all duration-300">
        {/* Quick start: click on image/overlay goes straight to default puzzle size */}
        <Link
          href={defaultHref}
          className="block w-full h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <div className="relative w-full h-full">
            {item.thumbUrl ? (
              <Image
                src={item.thumbUrl}
                alt={item.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                priority={priority}
                fetchPriority={priority ? "high" : "auto"}
                loading={priority ? "eager" : "lazy"}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                No image
              </div>
            )}

            {/* Bottom gradient overlay with title + range info */}
            <div className="absolute inset-x-0 bottom-0 p-3 flex items-center justify-between gap-2 bg-gradient-to-t from-black/75 via-black/45 to-transparent pointer-events-none">
              <div className="min-w-0">
                <h2 className="text-sm md:text-base font-semibold text-white truncate">
                  {item.title}
                </h2>
                <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] md:text-xs text-white/90">
                  <span>
                    {minPieces}–{maxPieces}
                  </span>
                  <span className="inline-flex items-center justify-center w-3.5 h-3.5 md:w-4 md:h-4 rounded-sm bg-black/35">
                    <img
                      src="/icons/puzzle.png"
                      alt=""
                      className="w-3 h-3 md:w-3.5 md:h-3.5 object-contain"
                      aria-hidden="true"
                    />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Difficulty chooser badge (separate control from quick start) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            toggleOpen();
          }}
          className="absolute bottom-3 right-3 inline-flex items-center justify-center w-[31px] h-[31px] md:w-[34px] md:h-[34px] rounded-full bg-surface shadow-soft hover:bg-surface-muted hover:shadow-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-haspopup="true"
          aria-expanded={isOpen}
          aria-label="Choose puzzle size"
        >
          <span className="relative inline-flex items-center justify-center w-[22px] h-[22px] md:w-[25px] md:h-[25px]">
            <img
              src="/icons/puzzle.png"
              alt=""
              className="w-full h-full object-contain drop-shadow-md"
              aria-hidden="true"
            />
            <span className="absolute inset-0 flex items-center justify-center text-xs md:text-sm font-extrabold text-slate-900 drop-shadow-[0_1px_3px_rgba(255,255,255,0.9)]">
              {defaultOption?.pieces}
            </span>
          </span>
        </button>

        {/* Size menu overlay */}
        {isOpen && (
          <div
            className="absolute bottom-[3.25rem] right-3 z-30 rounded-xl bg-surface shadow-strong border border-border px-2 py-2 flex flex-wrap gap-1.5"
            role="group"
            aria-label="Available puzzle sizes"
          >
            {JIGSAW_OPTIONS.map((opt) => (
              <Link
                key={opt.pieces}
                href={`/games/jigsaw?imageId=${item.id}&size=${opt.pieces}`}
                className="inline-flex items-center justify-center w-[31px] h-[31px] md:w-[34px] md:h-[34px] rounded-full bg-surface-muted text-xs font-semibold hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={closeMenu}
              >
                <span className="relative inline-flex items-center justify-center w-[22px] h-[22px] md:w-[25px] md:h-[25px]">
                  <img
                    src="/icons/puzzle.png"
                    alt=""
                    className="w-full h-full object-contain"
                    aria-hidden="true"
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs md:text-sm font-extrabold text-slate-900 drop-shadow-[0_1px_3px_rgba(255,255,255,0.9)]">
                    {opt.pieces}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
