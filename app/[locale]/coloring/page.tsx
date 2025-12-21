import { Container } from "@/ui/container";
import ColoringBrowser from "@/components/coloring-browser";
import { getItems, getCategories, getSubcategories } from "@/lib/content-repository";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
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
  
  const path = "/coloring";
  const url = getCanonicalUrl(path, validLocale);
  
  // Get categories for description
  const categories = await getCategories('coloring', validLocale);
  const categoryNames = categories.slice(0, 3).map(c => c.title).join(", ");
  
  const title = t("coloringPage.title") || "Coloring Pages for Kids";
  const description = categories.length > 0
    ? `${t("coloringPage.description") || "Free printable coloring pages"} - ${categoryNames} and more. ${t("coloringPage.subtitle") || "Fun and educational coloring activities for children."}`
    : t("coloringPage.description") || "Free printable coloring pages for kids. Fun and educational coloring activities.";

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

export default async function ColoringPage({
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

  // Fetch items and categories with current locale (limit items for better performance)
  const [items, categories] = await Promise.all([
    getItems('coloring', { locale: validLocale, limit: 500 }),
    getCategories('coloring', validLocale),
  ]);

  // Fetch all subcategories for the categories we have (in parallel batches)
  const subcategoryPromises = categories.map(cat => getSubcategories(cat.id, validLocale));
  const subcategoryArrays = await Promise.all(subcategoryPromises);
  const allSubcategories = subcategoryArrays.flat();

  const t = await getTranslations({ locale: validLocale, namespace: "common" });
  const pageTitle = t("coloringPage.title") || "Coloring Pages for Kids";
  const pageDescription = categories.length > 0
    ? `${t("coloringPage.description") || "Free printable coloring pages"} - ${categories.slice(0, 3).map(c => c.title).join(", ")} and more. ${t("coloringPage.subtitle") || "Fun and educational coloring activities for children."}`
    : t("coloringPage.description") || "Free printable coloring pages for kids. Fun and educational coloring activities.";

  // JSON-LD structured data for CollectionPage
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": pageTitle,
    "description": pageDescription,
    "url": getCanonicalUrl("/coloring", validLocale),
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
          "url": getCanonicalUrl(`/coloring/${item.slug || item.id}`, validLocale),
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
        <ColoringBrowser 
          initialItems={items} 
          initialCategories={categories}
          initialSubcategories={allSubcategories}
        />
      </Container>
    </>
  );
}
