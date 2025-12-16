import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getCategories, getSubcategories, getItems } from "@/lib/content-repository";
import { Link } from "@/i18n/routing";
import { ItemManager } from "./item-manager";

export default async function ItemsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale = routing.locales.includes(locale as any) 
    ? locale 
    : routing.defaultLocale;
  setRequestLocale(validLocale);
  
  const t = await getTranslations({ locale: validLocale, namespace: "common.adminPanel" });
  
  // Fetch categories and items
  const [coloringCategories, puzzleCategories, coloringItems, puzzleItems] = await Promise.all([
    getCategories('coloring', validLocale),
    getCategories('puzzles', validLocale),
    getItems('coloring', { locale: validLocale, limit: 100 }),
    getItems('puzzles', { locale: validLocale, limit: 100 }),
  ]);

  // Fetch all subcategories for all categories
  const allCategoryIds = [...coloringCategories, ...puzzleCategories].map(c => c.id);
  
  // Fetch subcategories for each category
  const subcategoryPromises = allCategoryIds.map(async (catId) => {
    try {
      const subs = await getSubcategories(catId, validLocale);
      if (process.env.NODE_ENV === 'development') {
        console.log(`Loaded ${subs.length} subcategories for category ${catId}`);
      }
      return subs;
    } catch (error) {
      console.error(`Error loading subcategories for category ${catId}:`, error);
      return [];
    }
  });
  
  const subcategoryArrays = await Promise.all(subcategoryPromises);
  const allSubcategoriesFlat = subcategoryArrays.flat();
  
  // Deduplicate subcategories by ID (in case a subcategory appears in multiple categories)
  const subcategoryMap = new Map<string, typeof allSubcategoriesFlat[0]>();
  for (const sub of allSubcategoriesFlat) {
    if (!subcategoryMap.has(sub.id)) {
      subcategoryMap.set(sub.id, sub);
    }
  }
  const allSubcategories = Array.from(subcategoryMap.values());

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('ItemsPage - Subcategory Summary:', {
      categoryCount: allCategoryIds.length,
      subcategoryCount: allSubcategories.length,
      subcategoriesByCategory: allSubcategories.reduce((acc, sub) => {
        acc[sub.categoryId] = (acc[sub.categoryId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      allSubcategories: allSubcategories.map(s => ({
        id: s.id,
        categoryId: s.categoryId,
        title: s.title
      }))
    });
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{t("manageItems") || "Manage Items"}</h1>
        <Link href="/admin" className="text-blue-700 hover:text-blue-900 font-semibold underline decoration-2 underline-offset-2">
          {t("backToAdmin")}
        </Link>
      </div>

      <ItemManager
        coloringCategories={coloringCategories}
        puzzleCategories={puzzleCategories}
        initialColoringItems={coloringItems}
        initialPuzzleItems={puzzleItems}
        allSubcategories={allSubcategories}
      />
    </div>
  );
}
