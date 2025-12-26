"use client";

import { Link } from "@/i18n/routing";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { getItems, getCategories } from "@/lib/content-repository";
import { MoreCard } from "@/components/more-card";
import { useState, useEffect, useMemo } from "react";
import type { Item, Category, Subcategory } from "@/types/content";

interface ColoringBrowserProps {
  initialItems?: Item[];
  initialCategories?: Category[];
  initialSubcategories?: Subcategory[];
}

export default function ColoringBrowser({ 
  initialItems,
  initialCategories,
  initialSubcategories = []
}: ColoringBrowserProps = {}) {
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
          getItems('coloring', { locale }),
          getCategories('coloring', locale),
        ]);
        setItems(itemsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Failed to load coloring items:", error);
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
        {t("noColoringPages")}
      </div>
    );
  }

  // Group items by category - memoized to avoid recalculation on every render
  const itemsByCategory = useMemo(() => {
    const map = new Map<string, Item[]>();
    items.forEach((item) => {
      const catId = item.categoryId;
      if (!map.has(catId)) {
        map.set(catId, []);
      }
      map.get(catId)!.push(item);
    });
    return map;
  }, [items]);

  // Get category details - memoized
  const categoryMap = useMemo(() => new Map(categories.map(cat => [cat.id, cat])), [categories]);

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="sr-only">{t("coloringPage.title") || "Coloring Pages for Kids"}</h1>
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

  const renderItem = (item: Item) => (
    <Link
      key={item.id}
      href={`/coloring/${item.slug || item.id}`}
      className="block p-2 rounded-2xl border border-white/30 bg-white/20 backdrop-blur-md hover:shadow-[0_12px_30px_rgba(0,0,0,0.16)] transition-shadow shadow-[0_10px_24px_rgba(0,0,0,0.12)]"
    >
      <div className="w-full relative aspect-[5/4] rounded-xl overflow-hidden bg-white/30">
        <Image
          src={item.thumbUrl || item.sourceUrl || "/placeholder.png"}
          alt={item.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 25vw"
          loading="lazy"
          fetchPriority="auto"
        />
      </div>

      <div className="mt-2 text-center text-sm font-semibold text-slate-800">
        {item.title}
      </div>
    </Link>
  );

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
          {visibleItemsMobile.map(renderItem)}
          {showMoreCardMobile && (
            <MoreCard 
              onClick={handleMoreClick} 
              isExpanded={isExpanded}
            />
          )}
        </div>

        {/* Desktop grid: 4 columns × 2 rows (7 items + More card) */}
        <div className="hidden md:grid md:grid-cols-4 gap-4">
          {visibleItemsDesktop.map(renderItem)}
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
