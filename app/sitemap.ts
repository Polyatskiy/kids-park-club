import { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import {
  getItems,
  getCategories,
  getSubcategories,
} from "@/lib/content-repository";
import { getLocalizedUrl } from "@/lib/seo-utils";

export const revalidate = 3600; // Revalidate every hour
export const runtime = 'nodejs'; // Ensure Node.js runtime for database access

// Allowed hostnames for sitemap URLs (canonical domain)
const ALLOWED_HOSTNAMES = ['www.kids-park.club', 'kids-park.club'];

// Validate URL format - strict validation to prevent invalid domains
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Strict check: only https and only allowed hostnames
    return (
      parsed.protocol === 'https:' &&
      ALLOWED_HOSTNAMES.includes(parsed.hostname) &&
      parsed.hostname.endsWith('kids-park.club') // Additional safety check
    );
  } catch {
    return false;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://www.kids-park.club";
  const now = new Date();

  // Static routes that exist for all locales
  const staticRoutes = [
    "",
    "/coloring",
    "/games",
    "/games/jigsaw/gallery",
    "/games/reaction",
    "/games/puzzle",
    "/popular",
  ];

  // Generate sitemap entries for all locales
  let entries: MetadataRoute.Sitemap = [];

  // Fetch dynamic content with error handling
  // If any fetch fails, we'll still return static routes
  let coloringItems: any[] = [];
  let puzzleItems: any[] = [];
  let coloringCategories: any[] = [];
  let puzzleCategories: any[] = [];

  try {
    // Fetch data with timeout protection
    const dataPromises = [
      getItems('coloring', { locale: null }),
      getItems('puzzles', { locale: null }),
      getCategories('coloring', null),
      getCategories('puzzles', null),
    ];

    // Create a timeout that resolves to empty arrays instead of rejecting
    // Increased to 15 seconds to allow more time for database queries, especially under load
    const timeoutPromise = new Promise<PromiseSettledResult<any>[]>((resolve) => 
      setTimeout(() => {
        // Return all rejected promises to indicate timeout
        resolve([
          { status: 'rejected' as const, reason: 'timeout' },
          { status: 'rejected' as const, reason: 'timeout' },
          { status: 'rejected' as const, reason: 'timeout' },
          { status: 'rejected' as const, reason: 'timeout' },
        ]);
      }, 15000) // Increased from 8000ms to 15000ms
    );

    const dataPromise = Promise.allSettled(dataPromises);
    
    // Race between data fetch and timeout
    const results = await Promise.race([dataPromise, timeoutPromise]);

    // Process results
    if (results[0]?.status === 'fulfilled') coloringItems = results[0].value || [];
    if (results[1]?.status === 'fulfilled') puzzleItems = results[1].value || [];
    if (results[2]?.status === 'fulfilled') coloringCategories = results[2].value || [];
    if (results[3]?.status === 'fulfilled') puzzleCategories = results[3].value || [];
  } catch (error) {
    // Log detailed error information for debugging
    console.error('Error fetching sitemap data:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    // Continue with static routes only - ensure we always return something
    // This is critical: empty sitemap causes "Couldn't fetch" errors
  }

  routing.locales.forEach((locale) => {
    // Add static routes (using localized URLs - EN unprefixed, others prefixed)
    staticRoutes.forEach((route) => {
      const url = getLocalizedUrl(route === "" ? "/" : route, locale);
      
      // Validate URL before adding
      if (!isValidUrl(url)) {
        console.warn(`Invalid URL in sitemap: ${url}`);
        return;
      }
      
      entries.push({
        url,
        lastModified: now,
        changeFrequency: route === "" ? "daily" : "weekly",
        priority: route === "" ? 1.0 : 0.8,
      });
    });

    // Add coloring category pages (using localized URLs)
    coloringCategories.forEach((category) => {
      if (!category?.id) return; // Skip invalid categories
      const categoryUrl = `${getLocalizedUrl("/coloring", locale)}?category=${encodeURIComponent(category.id)}`;
      
      // Validate URL before adding
      if (!isValidUrl(categoryUrl)) {
        console.warn(`Invalid category URL in sitemap: ${categoryUrl}`);
        return;
      }
      
      entries.push({
        url: categoryUrl,
        lastModified: (category.createdAt instanceof Date ? category.createdAt : now),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      });
    });

    // Add puzzle category pages (using localized URLs)
    puzzleCategories.forEach((category) => {
      if (!category?.id) return; // Skip invalid categories
      const categoryUrl = `${getLocalizedUrl("/games/jigsaw/gallery", locale)}?category=${encodeURIComponent(category.id)}`;
      
      // Validate URL before adding
      if (!isValidUrl(categoryUrl)) {
        console.warn(`Invalid puzzle category URL in sitemap: ${categoryUrl}`);
        return;
      }
      
      entries.push({
        url: categoryUrl,
        lastModified: (category.createdAt instanceof Date ? category.createdAt : now),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      });
    });

    // Add coloring pages (using ID or slug, with localized URLs)
    coloringItems.forEach((item) => {
      if (!item?.id && !item?.slug) return; // Skip invalid items
      const slug = item.slug || item.id;
      if (!slug) return;
      
      const itemDate = item.updatedAt instanceof Date 
        ? item.updatedAt 
        : (item.createdAt instanceof Date ? item.createdAt : now);
      
      const itemUrl = getLocalizedUrl(`/coloring/${encodeURIComponent(slug)}`, locale);
      
      // Validate URL before adding
      if (!isValidUrl(itemUrl)) {
        console.warn(`Invalid coloring item URL in sitemap: ${itemUrl}`);
        return;
      }
      
      entries.push({
        url: itemUrl,
        lastModified: itemDate,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      });
    });

    // Add puzzle pages (using ID or slug, with localized URLs)
    puzzleItems.forEach((item) => {
      if (!item?.id && !item?.slug) return; // Skip invalid items
      // Puzzles are accessed via jigsaw game, but we can still list them
      const itemDate = item.updatedAt instanceof Date 
        ? item.updatedAt 
        : (item.createdAt instanceof Date ? item.createdAt : now);
      
      entries.push({
        url: getLocalizedUrl("/games/jigsaw/gallery", locale),
        lastModified: itemDate,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      });
    });

  });

  // Ensure we always return at least some entries (static routes)
  // Empty sitemap can cause "Couldn't fetch" errors
  if (entries.length === 0) {
    // Fallback: return at least the home page
    entries.push({
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 1.0,
    });
  }

  // Check Google sitemap limits (50,000 URLs, 50MB uncompressed)
  // If exceeded, log warning and truncate (prioritize static routes)
  const MAX_URLS = 50000;
  if (entries.length > MAX_URLS) {
    console.warn(
      `Sitemap exceeds URL limit: ${entries.length} > ${MAX_URLS}. ` +
      `Consider splitting into multiple sitemaps. Truncating to ${MAX_URLS} entries.`
    );
    // Truncate to limit (static routes are added first, so they're preserved)
    entries = entries.slice(0, MAX_URLS);
  }

  // Note: Size check in bytes would require XML serialization, which is expensive.
  // Google recommends splitting into multiple sitemaps when >10MB.
  // For current project (~468 URLs), this is not critical, but we keep the URL limit check.

  return entries;
}
