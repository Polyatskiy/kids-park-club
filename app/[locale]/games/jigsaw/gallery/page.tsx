import { Container } from '@/ui/container';
import PuzzleBrowser from '@/components/puzzle-browser';
import { getItems, getCategories, getSubcategories } from '@/lib/content-repository';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import type { Metadata } from "next";
import { getCanonicalUrl, getHreflangUrls } from "@/lib/seo-utils";

export const revalidate = 3600; // Revalidate every hour

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
  
  const path = "/games/jigsaw/gallery";
  const url = getCanonicalUrl(path, validLocale);
  
  // Get categories for description
  const categories = await getCategories('puzzles', validLocale);
  const categoryNames = categories.slice(0, 3).map(c => c.title).join(", ");
  
  const title = t("puzzlesPage.title") || "Jigsaw Puzzles for Kids";
  const description = categories.length > 0
    ? `${t("puzzlesPage.description") || "Free online jigsaw puzzles"} - ${categoryNames} and more. ${t("puzzlesPage.subtitle") || "Fun and educational puzzle games for children."}`
    : t("puzzlesPage.description") || "Free online jigsaw puzzles for kids. Fun and educational puzzle games.";

  const alternateUrls = getHreflangUrls(path);

  const metadata: Metadata = {
    title,
    description,
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
    },
  };

  return metadata;
}

export default async function JigsawGalleryPage({
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

  // Fetch puzzles and categories with current locale
  const [items, categories] = await Promise.all([
    getItems('puzzles', { locale: validLocale }),
    getCategories('puzzles', validLocale),
  ]);

  // Fetch all subcategories for the categories we have
  const subcategoryPromises = categories.map(cat => getSubcategories(cat.id, validLocale));
  const subcategoryArrays = await Promise.all(subcategoryPromises);
  const allSubcategories = subcategoryArrays.flat();

  const t = await getTranslations({ locale: validLocale, namespace: "common" });
  const title = t("puzzlesPage.title") || "Jigsaw Puzzles for Kids";
  const description = categories.length > 0
    ? `${t("puzzlesPage.description") || "Free online jigsaw puzzles"} - ${categories.slice(0, 3).map(c => c.title).join(", ")} and more. ${t("puzzlesPage.subtitle") || "Fun and educational puzzle games for children."}`
    : t("puzzlesPage.description") || "Free online jigsaw puzzles for kids. Fun and educational puzzle games.";

  // JSON-LD structured data for CollectionPage
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": title,
    "description": description,
    "url": getCanonicalUrl("/games/jigsaw/gallery", validLocale),
    "inLanguage": validLocale,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": items.length,
      "itemListElement": items.slice(0, 20).map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "ImageObject",
          "name": item.title,
          "description": item.description,
          "url": getCanonicalUrl(`/games/jigsaw/gallery`, validLocale),
          "image": item.thumbUrl || item.sourceUrl,
          "thumbnailUrl": item.thumbUrl,
        },
      })),
    },
    "about": categories.map(cat => ({
      "@type": "Thing",
      "name": cat.title,
      "description": cat.description,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Container className="pt-20 md:pt-24 pb-8">
        <PuzzleBrowser 
          initialItems={items} 
          initialCategories={categories}
          initialSubcategories={allSubcategories}
        />
      </Container>
    </>
  );
}
