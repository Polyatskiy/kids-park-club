import { Container } from "@/ui/container";
import { Link } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getItems } from "@/lib/content-repository";
import { PopularItemCard } from "@/components/popular-item-card";

export default async function PopularPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale = routing.locales.includes(locale as any) 
    ? locale 
    : routing.defaultLocale;
  setRequestLocale(validLocale);
  
  const t = await getTranslations({ locale: validLocale, namespace: "common.pages" });
  
  // Get items from the last week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  // Fetch both coloring pages and puzzles from the last week
  const [recentColoring, recentPuzzles] = await Promise.all([
    getItems('coloring', { 
      locale: validLocale, 
      sinceDate: oneWeekAgo,
      sortBy: 'created_at',
      limit: 50 
    }),
    getItems('puzzles', { 
      locale: validLocale, 
      sinceDate: oneWeekAgo,
      sortBy: 'created_at',
      limit: 50 
    }),
  ]);
  
  // Combine and sort by creation date (newest first)
  const allRecentItems = [...recentColoring, ...recentPuzzles].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
  
  return (
    <Container className="pt-16 md:pt-20 pb-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            {t("popularTitle")}
          </h1>
          {allRecentItems.length === 0 ? (
            <p className="text-slate-800 text-lg mb-8">
              {t("popularDescription")}
            </p>
          ) : (
            <p className="text-slate-800 text-lg mb-8">
              {t("recentItemsDescription")}
            </p>
          )}
        </div>
        
        {allRecentItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {allRecentItems.map((item) => (
              <PopularItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="bg-white/25 backdrop-blur-xl border border-white/30 rounded-3xl p-8 md:p-12 shadow-[0_14px_36px_rgba(0,0,0,0.18)] text-center max-w-2xl mx-auto">
            <p className="text-slate-800 text-lg mb-8">
              {t("popularDescription")}
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.16)] transition-all hover:shadow-[0_12px_28px_rgba(0,0,0,0.2)]"
            >
              {t("backToHome")}
            </Link>
          </div>
        )}
      </div>
    </Container>
  );
}
