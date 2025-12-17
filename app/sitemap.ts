import { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import {
  getItems,
  getCategories,
  getSubcategories,
  getAudioStories,
  getBooks,
} from "@/lib/content-repository";
import { getLocalizedUrl } from "@/lib/seo-utils";

export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://kids-park.club";
  const now = new Date();

  // Static routes that exist for all locales
  const staticRoutes = [
    "",
    "/coloring",
    "/games",
    "/games/jigsaw/gallery",
    "/games/reaction",
    "/games/puzzle",
    "/audio-stories",
    "/books",
    "/popular",
  ];

  // Generate sitemap entries for all locales
  const entries: MetadataRoute.Sitemap = [];

  // Fetch dynamic content with error handling
  // If any fetch fails, we'll still return static routes
  let coloringItems: any[] = [];
  let puzzleItems: any[] = [];
  let coloringCategories: any[] = [];
  let puzzleCategories: any[] = [];
  let audioStories: any[] = [];
  let books: any[] = [];

  try {
    const results = await Promise.allSettled([
      getItems('coloring', { locale: null }),
      getItems('puzzles', { locale: null }),
      getCategories('coloring', null),
      getCategories('puzzles', null),
      getAudioStories(),
      getBooks(),
    ]);

    if (results[0].status === 'fulfilled') coloringItems = results[0].value;
    if (results[1].status === 'fulfilled') puzzleItems = results[1].value;
    if (results[2].status === 'fulfilled') coloringCategories = results[2].value;
    if (results[3].status === 'fulfilled') puzzleCategories = results[3].value;
    if (results[4].status === 'fulfilled') audioStories = results[4].value;
    if (results[5].status === 'fulfilled') books = results[5].value;
  } catch (error) {
    console.error('Error fetching sitemap data:', error);
    // Continue with static routes only
  }

  routing.locales.forEach((locale) => {
    // Add static routes (using localized URLs - EN unprefixed, others prefixed)
    staticRoutes.forEach((route) => {
      const url = getLocalizedUrl(route === "" ? "/" : route, locale);
      
      entries.push({
        url,
        lastModified: now,
        changeFrequency: route === "" ? "daily" : "weekly",
        priority: route === "" ? 1.0 : 0.8,
      });
    });

    // Add coloring category pages (using localized URLs)
    coloringCategories.forEach((category) => {
      entries.push({
        url: `${getLocalizedUrl("/coloring", locale)}?category=${category.id}`,
        lastModified: category.createdAt || now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      });
    });

    // Add puzzle category pages (using localized URLs)
    puzzleCategories.forEach((category) => {
      entries.push({
        url: `${getLocalizedUrl("/games/jigsaw/gallery", locale)}?category=${category.id}`,
        lastModified: category.createdAt || now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      });
    });

    // Add coloring pages (using ID or slug, with localized URLs)
    coloringItems.forEach((item) => {
      const slug = item.slug || item.id;
      entries.push({
        url: getLocalizedUrl(`/coloring/${slug}`, locale),
        lastModified: item.updatedAt || item.createdAt || now,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      });
    });

    // Add puzzle pages (using ID or slug, with localized URLs)
    puzzleItems.forEach((item) => {
      const slug = item.slug || item.id;
      // Puzzles are accessed via jigsaw game, but we can still list them
      entries.push({
        url: getLocalizedUrl("/games/jigsaw/gallery", locale),
        lastModified: item.updatedAt || item.createdAt || now,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      });
    });

    // Add audio story pages (using localized URLs)
    audioStories.forEach((story) => {
      entries.push({
        url: getLocalizedUrl(`/audio-stories/${story.slug}`, locale),
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      });
    });

    // Add book pages (using localized URLs)
    books.forEach((book) => {
      entries.push({
        url: getLocalizedUrl(`/books/${book.slug}`, locale),
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      });
    });
  });

  return entries;
}
