import { HomeTile } from "@/components/home-tile";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { getCanonicalUrl, getHreflangUrls } from "@/lib/seo-utils";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const validLocale = routing.locales.includes(locale as any) 
    ? locale 
    : routing.defaultLocale;
  setRequestLocale(validLocale);
  
  const t = await getTranslations({ locale: validLocale, namespace: "common" });
  
  const path = "/";
  const url = getCanonicalUrl(path, validLocale);
  const alternateUrls = getHreflangUrls(path);
  
  // Localized titles and descriptions for better SEO
  const titles: Record<string, string> = {
    en: "Kids Park Club – Free Coloring Pages, Puzzles & Games for Kids",
    pl: "Kids Park Club – Darmowe Kolorowanki, Puzzle i Gry dla Dzieci",
    ru: "Kids Park Club – Бесплатные Раскраски, Пазлы и Игры для Детей",
    uk: "Kids Park Club – Безкоштовні Розмальовки, Пазли та Ігри для Дітей",
  };
  
  const descriptions: Record<string, string> = {
    en: "Discover thousands of free printable coloring pages, interactive jigsaw puzzles, and fun educational games for kids. Perfect for toddlers, preschoolers, and school-age children. Download, print, and play today!",
    pl: "Odkryj tysiące darmowych kolorowanek do druku, interaktywnych puzzli i zabawnych gier edukacyjnych dla dzieci. Idealne dla maluchów, przedszkolaków i dzieci w wieku szkolnym. Pobierz, wydrukuj i graj już dziś!",
    ru: "Откройте для себя тысячи бесплатных раскрасок для печати, интерактивных пазлов и веселых обучающих игр для детей. Идеально для малышей, дошкольников и школьников. Скачивайте, печатайте и играйте уже сегодня!",
    uk: "Відкрийте для себе тисячі безкоштовних розмальовок для друку, інтерактивних пазлів та веселих навчальних ігор для дітей. Ідеально для малюків, дошкільнят та школярів. Завантажуйте, друкуйте та грайте вже сьогодні!",
  };
  
  const title = titles[validLocale] || titles.en;
  const description = descriptions[validLocale] || descriptions.en;
  
  return {
    title,
    description,
    keywords: validLocale === 'en' 
      ? "coloring pages, kids games, puzzles, printable activities, children entertainment, educational games"
      : undefined,
    alternates: {
      canonical: url,
      languages: {
        ...alternateUrls,
        'x-default': getCanonicalUrl(path, routing.defaultLocale),
      },
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      locale: validLocale,
      alternateLocale: routing.locales.filter(l => l !== validLocale),
      siteName: "Kids Park Club",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function HomePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Ensure locale is valid
  const validLocale = routing.locales.includes(locale as any) 
    ? locale 
    : routing.defaultLocale;
  
  // Set request locale for server components
  setRequestLocale(validLocale);
  
  // Explicitly pass locale to ensure correct translations are loaded
  const t = await getTranslations({ locale: validLocale, namespace: "common" });
  
  // Calculate URL for structured data
  const path = "/";
  const url = getCanonicalUrl(path, validLocale);
  
  const tiles = [
    {
      icon: "/assets/icon-crayons.png",
      label: t("coloring"),
      href: "/coloring",
      bgColor: "rgba(155, 140, 217, 0.65)", // Purple with transparency
      glowColor: "rgba(155, 140, 217, 0.4)",
    },
    {
      icon: "/icons/puzzle.png",
      label: t("puzzles"),
      href: "/games/jigsaw/gallery",
      bgColor: "rgba(245, 200, 66, 0.65)", // Yellow with transparency
      glowColor: "rgba(245, 200, 66, 0.4)",
    },
    {
      icon: "/assets/icon-gamepad.png",
      label: t("games"),
      href: "/games",
      bgColor: "rgba(91, 168, 229, 0.65)", // Blue with transparency
      glowColor: "rgba(91, 168, 229, 0.4)",
    },
    {
      icon: "/assets/icon-star.png",
      label: t("popular"),
      href: "/popular",
      bgColor: "rgba(245, 166, 35, 0.65)", // Orange with transparency
      glowColor: "rgba(245, 166, 35, 0.4)",
    },
  ];
  return (
    <>
      {/* SEO: Hidden H1 for search engines */}
      <h1 className="sr-only">
        {validLocale === 'en' 
          ? "Kids Park Club – Free Coloring Pages, Puzzles & Games for Kids"
          : validLocale === 'pl'
          ? "Kids Park Club – Darmowe Kolorowanki, Puzzle i Gry dla Dzieci"
          : validLocale === 'ru'
          ? "Kids Park Club – Бесплатные Раскраски, Пазлы и Игры для Детей"
          : "Kids Park Club – Безкоштовні Розмальовки, Пазли та Ігри для Дітей"
        }
      </h1>
      
      {/* Structured Data (JSON-LD) for better SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Kids Park Club",
            "url": url,
            "description": validLocale === 'en'
              ? "Free printable coloring pages, jigsaw puzzles, and fun educational games for kids"
              : validLocale === 'pl'
              ? "Darmowe kolorowanki do druku, puzzle i zabawne gry edukacyjne dla dzieci"
              : validLocale === 'ru'
              ? "Бесплатные раскраски для печати, пазлы и веселые обучающие игры для детей"
              : "Безкоштовні розмальовки для друку, пазли та веселі навчальні ігри для дітей",
            "inLanguage": validLocale,
            "potentialAction": {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": `${url}?search={search_term_string}`
              },
              "query-input": "required name=search_term_string"
            }
          })
        }}
      />
      
      <div className="min-h-screen flex items-center justify-center md:justify-end px-4 md:px-8 lg:px-12 pt-24 md:pt-0 home-tiles-container">
        {/* Tiles Grid - positioned to avoid overlapping the girl */}
        <div className="w-full max-w-[320px] md:max-w-[400px] lg:max-w-[440px] md:mr-4 lg:mr-8 xl:mr-16">
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {tiles.map((tile) => (
              <HomeTile
                key={tile.href}
                icon={tile.icon}
                label={tile.label}
                href={tile.href}
                bgColor={tile.bgColor}
                glowColor={tile.glowColor}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
