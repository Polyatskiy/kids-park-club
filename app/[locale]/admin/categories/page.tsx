import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getCategories, getSubcategories } from "@/lib/content-repository";
import type { Subcategory } from "@/types/content";
import { Link } from "@/i18n/routing";
import { CategoryManager } from "./category-manager";

export default async function CategoriesPage({
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
  
  // Fetch all categories
  const [coloringCategories, puzzleCategories, bothCategories] = await Promise.all([
    getCategories('coloring', validLocale),
    getCategories('puzzles', validLocale),
    getCategories('both', validLocale),
  ]);

  // Fetch all subcategories for all categories
  const allCategoryIds = [...coloringCategories, ...puzzleCategories, ...bothCategories].map(c => c.id);
  const subcategoryPromises = allCategoryIds.map(catId => getSubcategories(catId, validLocale));
  const subcategoryArrays = await Promise.all(subcategoryPromises);
  const allSubcategoriesFlat = subcategoryArrays.flat();
  
  // Deduplicate subcategories by ID (in case of duplicates)
  const subcategoryMap = new Map<string, Subcategory>();
  allSubcategoriesFlat.forEach(sub => {
    if (!subcategoryMap.has(sub.id)) {
      subcategoryMap.set(sub.id, sub);
    }
  });
  const allSubcategories = Array.from(subcategoryMap.values());

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{t("manageCategories") || "Manage Categories"}</h1>
        <Link href="/admin" className="text-blue-700 hover:text-blue-900 font-semibold underline decoration-2 underline-offset-2">
          {t("backToAdmin")}
        </Link>
      </div>

      <CategoryManager
        initialColoringCategories={coloringCategories}
        initialPuzzleCategories={puzzleCategories}
        initialBothCategories={bothCategories}
        initialSubcategories={allSubcategories}
      />
    </div>
  );
}
