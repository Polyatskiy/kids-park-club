import ColoringCanvas from "@/components/coloring-canvas";
import { notFound } from "next/navigation";
import { getItemBySlug, getItemById, getCategoryById, getSubcategoryById } from "@/lib/content-repository";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";
import { getCanonicalUrl, getHreflangUrls } from "@/lib/seo-utils";
import { setRequestLocale } from "next-intl/server";

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

  // Fetch category and subcategory for structured data
  const [category, subcategory] = await Promise.all([
    item.categoryId ? getCategoryById(item.categoryId, validLocale) : null,
    item.subcategoryId ? getSubcategoryById(item.subcategoryId, validLocale) : null,
  ]);

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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="flex flex-col w-full overflow-hidden coloring-page-container" style={{ 
        height: '100vh', 
        minHeight: '100vh',
        maxHeight: '100vh'
      }}>
        <ColoringCanvas src={imageUrl} closeHref="/coloring" />
      </div>
    </>
  );
}
