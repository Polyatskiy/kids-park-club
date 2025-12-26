import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { getItemBySlug, getItemById, getCategoryById, getSubcategoryById, getItems } from "@/lib/content-repository";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { getCanonicalUrl, getHreflangUrls } from "@/lib/seo-utils";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { Link } from "@/i18n/routing";
import { SimilarItems } from "@/components/similar-items";
import { SeoContentOverlay } from "@/components/seo-content-overlay";

// Dynamically import ColoringCanvas to reduce initial bundle size
const ColoringCanvas = dynamic(() => import("@/components/coloring-canvas"), {
  loading: () => (
    <div className="flex items-center justify-center w-full h-screen bg-sky-100">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-700">Loading coloring page...</p>
      </div>
    </div>
  ),
});

type Props = {
  params: Promise<{ slug: string; locale: string }>;
};

export const revalidate = 3600; // Revalidate every hour

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale: paramLocale } = await params;
  const validLocale = routing.locales.includes(paramLocale as any) 
    ? paramLocale 
    : routing.defaultLocale;
  
  setRequestLocale(validLocale);

  // Try to get item by slug first, then by ID
  let item = await getItemBySlug(slug, 'coloring', validLocale);
  if (!item) {
    item = await getItemById(slug, validLocale);
    if (item && item.type !== 'coloring') {
      item = null;
    }
  }

  if (!item) {
    return {
      title: "Coloring Page Not Found",
      description: "The requested coloring page could not be found.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const path = `/coloring/${slug}`;
  const url = getCanonicalUrl(path, validLocale);
  const title = `${item.title} - Free Coloring Page`;
  const description = item.description || `${item.title} - Free printable coloring page for kids. Download and print this fun coloring activity.`;

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
      images: item.thumbUrl ? [{
        url: item.thumbUrl,
        width: item.width || 800,
        height: item.height || 600,
        alt: item.title,
      }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: item.thumbUrl ? [item.thumbUrl] : undefined,
    },
  };

  return metadata;
}

export default async function ColoringPage({ params }: Props) {
  const { slug, locale: paramLocale } = await params;
  
  // Ensure locale is valid
  const validLocale = routing.locales.includes(paramLocale as any) 
    ? paramLocale 
    : routing.defaultLocale;
  
  // Set request locale for server components
  setRequestLocale(validLocale);

  // Try to get item by slug first, then by ID (slug can be either)
  let item = await getItemBySlug(slug, 'coloring', validLocale);
  
  // If not found by slug, try as ID
  if (!item) {
    item = await getItemById(slug, validLocale);
    // Make sure it's a coloring item
    if (item && item.type !== 'coloring') {
      item = null;
    }
  }

  if (!item) {
    notFound();
  }

  const imageUrl = item.sourceUrl;

  if (!imageUrl) {
    console.error("Image URL missing for item:", item.id);
    notFound();
  }

  // Fetch category and subcategory for structured data and breadcrumbs
  const [category, subcategory] = await Promise.all([
    item.categoryId ? getCategoryById(item.categoryId, validLocale) : null,
    item.subcategoryId ? getSubcategoryById(item.subcategoryId, validLocale) : null,
  ]);

  // Fetch similar items for internal linking - сначала из той же категории/подкатегории, затем общие
  let similarItems = await getItems('coloring', {
    locale: validLocale,
    categoryId: item.categoryId || undefined,
    subcategoryId: item.subcategoryId || undefined,
    limit: 13, // Get 13 to show 12 (excluding current)
  });
  
  // Если не хватает элементов, добавляем из той же категории (без подкатегории)
  if (similarItems.length < 13 && item.categoryId && item.subcategoryId) {
    const additionalItems = await getItems('coloring', {
      locale: validLocale,
      categoryId: item.categoryId,
      limit: 13,
    });
    const existingIds = new Set(similarItems.map(i => i.id));
    const newItems = additionalItems.filter(i => !existingIds.has(i.id) && i.id !== item.id);
    similarItems = [...similarItems, ...newItems].slice(0, 13);
  }
  
  // Если всё ещё не хватает, добавляем общие
  if (similarItems.length < 13) {
    const additionalItems = await getItems('coloring', {
      locale: validLocale,
      limit: 13,
    });
    const existingIds = new Set(similarItems.map(i => i.id));
    const newItems = additionalItems.filter(i => !existingIds.has(i.id) && i.id !== item.id);
    similarItems = [...similarItems, ...newItems].slice(0, 13);
  }

  // Build breadcrumb list for structured data
  const breadcrumbItems = [
    { name: "Home", url: getCanonicalUrl("/", validLocale) },
    { name: "Coloring Pages", url: getCanonicalUrl("/coloring", validLocale) },
  ];
  
  if (category) {
    breadcrumbItems.push({
      name: category.title,
      url: getCanonicalUrl(`/coloring?category=${category.id}`, validLocale),
    });
  }
  
  if (subcategory) {
    breadcrumbItems.push({
      name: subcategory.title,
      url: getCanonicalUrl(`/coloring?subcategory=${subcategory.id}`, validLocale),
    });
  }
  
  breadcrumbItems.push({
    name: item.title,
    url: getCanonicalUrl(`/coloring/${slug}`, validLocale),
  });

  // JSON-LD structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    "name": item.title,
    "description": item.description || `${item.title} - Free printable coloring page for kids`,
    "image": item.sourceUrl,
    "thumbnailUrl": item.thumbUrl,
    "url": getCanonicalUrl(`/coloring/${slug}`, validLocale),
    "width": item.width,
    "height": item.height,
    "license": "https://creativecommons.org/licenses/by/4.0/",
    "inLanguage": validLocale,
    ...(category && {
      "about": {
        "@type": "Thing",
        "name": category.title,
        "description": category.description,
      },
    }),
    ...(subcategory && {
      "genre": subcategory.title,
    }),
  };

  // BreadcrumbList structured data
  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbItems.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
      />
      
      {/* SEO Content Overlay - компактный оверлей, не мешает игре */}
      <div className="relative w-full" style={{ minHeight: '100vh' }}>
        <SeoContentOverlay
          title={item.title}
          description={item.description || `${item.title} - Free printable coloring page for kids. Download and print this fun coloring activity.`}
          breadcrumbItems={breadcrumbItems}
          position="top-left"
          topOffset="8px"
        />
        
        <div className="flex flex-col w-full overflow-hidden coloring-page-container" style={{ 
          height: '100vh', 
          minHeight: '100vh',
          maxHeight: '100vh'
        }}>
          <Suspense fallback={
            <div className="flex items-center justify-center w-full h-screen bg-sky-100">
              <div className="text-center">
                <div className="inline-block w-12 h-12 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-700">Loading coloring page...</p>
              </div>
            </div>
          }>
            <ColoringCanvas src={imageUrl} closeHref="/coloring" />
          </Suspense>
        </div>
      </div>

      {/* Similar Items - visible in HTML, positioned at bottom, компактная высота */}
      {/* На мобильных поднимаем над toolbar (примерно 80px от низа) */}
      <div className="absolute bottom-[80px] md:bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-slate-200/50 max-h-[140px] md:max-h-[160px] overflow-hidden pointer-events-auto">
        <div className="max-w-7xl mx-auto px-2 md:px-3 py-2">
          <SimilarItems
            items={similarItems}
            type="coloring"
            currentItemId={item.id}
            locale={validLocale}
          />
        </div>
      </div>
    </>
  );
}
