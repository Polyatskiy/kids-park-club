import dynamic from "next/dynamic";
import { getPuzzleById, getItemById, getCategoryById, getSubcategoryById, getItems } from "@/lib/content-repository";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { getCanonicalUrl, getHreflangUrls } from "@/lib/seo-utils";
import { setRequestLocale } from "next-intl/server";
import { SimilarItems } from "@/components/similar-items";
import { SeoContentOverlay } from "@/components/seo-content-overlay";

// Dynamically import JigsawGame to reduce initial bundle size and improve INP
const JigsawGame = dynamic(() => import("./JigsawGame"), {
  loading: () => (
    <div className="flex items-center justify-center w-full h-screen bg-gradient-to-b from-sky-200 via-sky-100 to-emerald-100">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-700">Loading puzzle...</p>
      </div>
    </div>
  ),
});

interface JigsawPageProps {
  params?: Promise<{ locale: string }>;
  searchParams?: Promise<{
    imageId?: string;
    image?: string; // fallback for old URLs
    size?: string;
  }>;
}

export const revalidate = 3600; // Revalidate every hour

export async function generateMetadata({ params, searchParams }: JigsawPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const locale = resolvedParams?.locale || routing.defaultLocale;
  const validLocale = routing.locales.includes(locale as any) 
    ? locale 
    : routing.defaultLocale;
  
  setRequestLocale(validLocale);

  const imageId = resolvedSearchParams?.imageId || resolvedSearchParams?.image;
  const hasSize = Boolean(resolvedSearchParams?.size);

  if (!imageId) {
    return {
      title: "Jigsaw Puzzle Game - Kids Park Club",
      description: "Play free online jigsaw puzzles for kids. Choose from hundreds of fun puzzle images.",
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  // Try to get puzzle from Supabase
  let puzzle = await getPuzzleById(imageId);
  
  // If not found, try to get from items table
  if (!puzzle) {
    const item = await getItemById(imageId, validLocale);
    if (item && item.type === 'puzzles') {
      const sourceUrl = item.sourceUrl;
      if (sourceUrl) {
        puzzle = {
          id: item.id,
          title: item.title,
          slug: item.slug || item.id,
          category: '',
          subCategory: item.subcategoryId || undefined,
          imageUrl: sourceUrl,
          thumbnailUrl: item.thumbUrl || '',
        };
      }
    }
  }

  if (!puzzle) {
    return {
      title: "Puzzle Not Found - Kids Park Club",
      description: "The requested puzzle could not be found.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  // Base URL without size parameter to avoid duplicates
  const basePath = `/games/jigsaw?imageId=${imageId}`;
  const url = getCanonicalUrl(basePath, validLocale);
  const title = `${puzzle.title} - Jigsaw Puzzle`;
  const description = `${puzzle.title} - Free online jigsaw puzzle for kids. Play and have fun assembling this interactive puzzle!`;

  const alternateUrls = getHreflangUrls(basePath);

  const metadata: Metadata = {
    title,
    description,
    alternates: {
      canonical: url, // Canonical without size parameter
      languages: {
        ...alternateUrls,
        'x-default': getCanonicalUrl(basePath, routing.defaultLocale),
      },
    },
    robots: {
      // Index only if no size parameter (to avoid duplicates)
      index: !hasSize,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      locale: validLocale,
      alternateLocale: routing.locales.filter(l => l !== validLocale),
      images: puzzle.imageUrl ? [{
        url: puzzle.imageUrl,
        width: 800,
        height: 600,
        alt: puzzle.title,
      }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: puzzle.imageUrl ? [puzzle.imageUrl] : undefined,
    },
  };

  return metadata;
}

export default async function JigsawPage({ params, searchParams }: JigsawPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const locale = resolvedParams?.locale || routing.defaultLocale;
  const validLocale = routing.locales.includes(locale as any) 
    ? locale 
    : routing.defaultLocale;
  
  setRequestLocale(validLocale);
  
  // Support both imageId (new) and image (old) query params
  const imageId = resolvedSearchParams?.imageId || resolvedSearchParams?.image;
  const size = resolvedSearchParams?.size;
  const gridSize = size ? Number(size) : undefined;

  // If we have an imageId, try to load the puzzle from Supabase
  let puzzleImageUrl: string | undefined;
  let puzzleTitle: string | undefined;
  let puzzleItem: any = null;
  let category = null;
  let subcategory = null;
  let similarItems: any[] = [];

  if (imageId) {
    // First try to load from Supabase (if it's a numeric ID)
    const puzzle = await getPuzzleById(imageId);
    if (puzzle) {
      puzzleImageUrl = puzzle.imageUrl;
      puzzleTitle = puzzle.title;
    } else {
      // Try to get from items table
      const item = await getItemById(imageId, validLocale);
      if (item && item.type === 'puzzles') {
        puzzleItem = item;
        puzzleImageUrl = item.sourceUrl;
        puzzleTitle = item.title;
        
        // Fetch category and subcategory
        if (item.categoryId) {
          category = await getCategoryById(item.categoryId, validLocale);
        }
        if (item.subcategoryId) {
          subcategory = await getSubcategoryById(item.subcategoryId, validLocale);
        }
        
        // Fetch similar items - сначала из той же категории/подкатегории, затем общие
        similarItems = await getItems('puzzles', {
          locale: validLocale,
          categoryId: item.categoryId || undefined,
          subcategoryId: item.subcategoryId || undefined,
          limit: 13, // Get 13 to show 12 (excluding current)
        });
        
        // Если не хватает элементов, добавляем из той же категории (без подкатегории)
        if (similarItems.length < 13 && item.categoryId && item.subcategoryId) {
          const additionalItems = await getItems('puzzles', {
            locale: validLocale,
            categoryId: item.categoryId,
            limit: 13,
          });
          const existingIds = new Set(similarItems.map(i => i.id));
          const newItems = additionalItems.filter(i => !existingIds.has(i.id) && i.id !== imageId);
          similarItems = [...similarItems, ...newItems].slice(0, 13);
        }
        
        // Если всё ещё не хватает, добавляем общие
        if (similarItems.length < 13) {
          const additionalItems = await getItems('puzzles', {
            locale: validLocale,
            limit: 13,
          });
          const existingIds = new Set(similarItems.map(i => i.id));
          const newItems = additionalItems.filter(i => !existingIds.has(i.id) && i.id !== imageId);
          similarItems = [...similarItems, ...newItems].slice(0, 13);
        }
      }
    }
  }

  // Build breadcrumb list for structured data
  const breadcrumbItems = [
    { name: "Home", url: getCanonicalUrl("/", validLocale) },
    { name: "Jigsaw Puzzles", url: getCanonicalUrl("/games/jigsaw/gallery", validLocale) },
  ];
  
  if (category) {
    breadcrumbItems.push({
      name: category.title,
      url: getCanonicalUrl(`/games/jigsaw/gallery?category=${category.id}`, validLocale),
    });
  }
  
  if (subcategory) {
    breadcrumbItems.push({
      name: subcategory.title,
      url: getCanonicalUrl(`/games/jigsaw/gallery?subcategory=${subcategory.id}`, validLocale),
    });
  }
  
  if (puzzleTitle) {
    breadcrumbItems.push({
      name: puzzleTitle,
      url: getCanonicalUrl(`/games/jigsaw?imageId=${imageId}`, validLocale),
    });
  }

  // JSON-LD structured data for puzzle
  const structuredData = puzzleTitle ? {
    "@context": "https://schema.org",
    "@type": "Game",
    "name": puzzleTitle,
    "description": `${puzzleTitle} - Free online jigsaw puzzle for kids. Play and have fun assembling this interactive puzzle!`,
    "gameLocation": getCanonicalUrl(`/games/jigsaw?imageId=${imageId}`, validLocale),
    "image": puzzleImageUrl,
    "inLanguage": validLocale,
    ...(category && {
      "about": {
        "@type": "Thing",
        "name": category.title,
      },
    }),
  } : null;

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

  const puzzleDescription = puzzleTitle 
    ? `${puzzleTitle} - Free online jigsaw puzzle for kids. Play and have fun assembling this interactive puzzle!`
    : '';

  return (
    <>
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
      />
      
      <div className="relative w-full" style={{ minHeight: '100vh' }}>
        {/* SEO Content Overlay - компактный оверлей, не мешает игре */}
        {/* Ограничиваем ширину, чтобы не заходить на game board (меню справа ~320px, оставляем зону слева) */}
        {puzzleTitle && (
          <SeoContentOverlay
            title={puzzleTitle}
            description={puzzleDescription || null}
            breadcrumbItems={breadcrumbItems}
            position="top-left"
            maxWidth="max-w-[calc(100vw-22rem)] md:max-w-[280px]"
          />
        )}
        <JigsawGame
          initialImageId={imageId}
          initialGridSize={gridSize}
          puzzleImageUrl={puzzleImageUrl}
          puzzleTitle={puzzleTitle}
        />
      </div>

      {/* Similar Items - visible in HTML, positioned at bottom, компактная высота */}
      {/* Скрываем на мобильных, чтобы не перекрывать toolbar */}
      {similarItems.length > 0 && (
        <div className="hidden md:block absolute bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-slate-200/50 max-h-[160px] overflow-hidden pointer-events-auto">
          <div className="max-w-7xl mx-auto px-3 py-2">
            <SimilarItems
              items={similarItems}
              type="puzzles"
              currentItemId={imageId || ""}
              locale={validLocale}
            />
          </div>
        </div>
      )}
    </>
  );
}
